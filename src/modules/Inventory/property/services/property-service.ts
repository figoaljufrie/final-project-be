import {
  $Enums,
  RoomAvailability as PrismaRoomAvailability,
} from "../../../../generated/prisma";
import { ApiError } from "../../../../shared/utils/api-error";
import { PeakSeasonDto } from "../../pricing/dto/availability-dto";
import { AvailabilityService } from "../../pricing/services/availability-service";
import { PeakSeasonService } from "../../pricing/services/peak-season-service";
import {
  buildAvailabilityMap,
  checkRoomRangeAvailability,
  getDateRange,
} from "../../property/helpers/property-helpers";
import {
  CreatePropertyDto,
  PropertyCreateRepoDto,
  PropertySearchQueryDto,
  PropertyUpdateRepoDto,
  UpdatePropertyDto,
} from "../dto/property-dto";
import { PropertyRepository } from "../repository/property-repository";
import { PropertySearcher } from "../searcher/property-searcher";

type RoomAvailabilityType = PrismaRoomAvailability;

export class PropertyService {
  private propertyRepository = new PropertyRepository();
  private availabilityService = new AvailabilityService();
  private peakSeasonService = new PeakSeasonService();
  private propertySearcher: PropertySearcher;

  constructor() {
    // FIX 1: Pass the new peakSeasonService dependency to the PropertySearcher
    this.propertySearcher = new PropertySearcher(
      this.propertyRepository,
      this.availabilityService,
      this.peakSeasonService // Added required third argument
    );
  }

  public async createProperty(tenantId: number, payload: CreatePropertyDto) {
    const slug = payload.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const repoPayload: PropertyCreateRepoDto = {
      name: payload.name,
      slug: slug,
      description: payload.description,
      category: payload.category as $Enums.PropertyCategory,
      tenant: {
        connect: { id: tenantId },
      },
    };

    return this.propertyRepository.create(repoPayload);
  }

  public async updateProperty(
    tenantId: number,
    propertyId: number,
    data: UpdatePropertyDto
  ) {
    const existing = await this.propertyRepository.findById(propertyId);
    if (!existing) throw new ApiError("Property not found", 404);
    if (existing.tenantId !== tenantId)
      throw new ApiError("Not Authorized", 403);

    const { category, ...rest } = data;

    const updateData: Partial<PropertyUpdateRepoDto> = {
      ...rest,
      ...(category && {
        category: category as $Enums.PropertyCategory,
      }),
    };

    if (data.name) {
      updateData.slug = data.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
    }

    return this.propertyRepository.update(propertyId, updateData);
  }

  public async getPropertyDetails(
    propertyId: number,
    checkInDate?: Date,
    checkOutDate?: Date
  ) {
    const property = await this.propertyRepository.findByIdWithRooms(
      propertyId
    );
    if (!property) throw new ApiError("Property not found", 404);

    if (!checkInDate || !checkOutDate) {
      return property;
    }

    if (checkInDate >= checkOutDate) {
      throw new ApiError("Check-out date must be after check-in date.", 400);
    }

    const roomIds = property.rooms.map((r) => r.id);
    const dateRange = getDateRange(checkInDate, checkOutDate, false);

    const [peakSeasons, availabilityData] = await Promise.all([
      this.peakSeasonService.findActivePeakSeasonsForProperty(
        propertyId,
        checkInDate,
        checkOutDate
      ),
      this.availabilityService.getBulkAvailabilityForRooms(
        roomIds,
        checkInDate,
        checkOutDate
      ),
    ]);

    const availMap = buildAvailabilityMap(availabilityData);

    const roomsWithPrices = property.rooms.map((room) => {
      const { isAvailable, minPrice } = checkRoomRangeAvailability(
        room.id,
        room.basePrice,
        dateRange,
        availMap,
        peakSeasons
      );

      return {
        ...room,
        calculatedPrice: isAvailable ? minPrice : null,
        isAvailable: isAvailable,
      };
    });

    (property as any).rooms = roomsWithPrices;

    return property;
  }

  // FIX 2: Added tenantId parameter and passed it to the searcher
  public async searchProperties(params: PropertySearchQueryDto) {
    return this.propertySearcher.search(params);
  }

  public async softDeleteProperty(propertyId: number) {
    return this.propertyRepository.softDelete(propertyId);
  }

  public async getPropertyCalendar(
    propertyId: number,
    month: number,
    year: number
  ) {
    const property = await this.propertyRepository.findByIdWithRooms(
      propertyId
    );
    if (!property) throw new ApiError("Property not found", 404);

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const roomIds = property.rooms.map((r) => r.id);
    const dateRange = getDateRange(startDate, endDate, true);

    const [peakSeasons, availabilityData] = await Promise.all([
      this.peakSeasonService.findActivePeakSeasonsForProperty(
        propertyId,
        startDate,
        endDate
      ),
      this.availabilityService.getBulkAvailabilityForRooms(
        roomIds,
        startDate,
        endDate
      ),
    ]);

    const availMap = buildAvailabilityMap(availabilityData);

    const calendarData = property.rooms.map((room) => {
      const dailyPrices = dateRange.map((date) => {
        const dateKey = date.toISOString().split("T")[0];
        const availability = availMap.get(`${room.id}-${dateKey}`) ?? null;

        const activePeakSeasons = peakSeasons.filter(
          (ps) => date >= ps.startDate && ps.endDate && date <= ps.endDate
        );

        const { price, available } =
          this.availabilityService.getDailyCalculatedPrice(
            room.basePrice,
            availability as RoomAvailabilityType | null,
            activePeakSeasons as PeakSeasonDto[]
          );

        return {
          date: date.toISOString().split("T")[0],
          price,
          available,
        };
      });

      return {
        roomId: room.id,
        roomName: room.name,
        dailyPrices,
      };
    });

    return {
      property: {
        id: property.id,
        name: property.name,
      },
      calendar: calendarData,
    };
  }
}
