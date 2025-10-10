import {
  $Enums,
  RoomAvailability as PrismaRoomAvailability,
} from "../../../../generated/prisma";
import { ApiError } from "../../../../shared/utils/api-error";
import { ImageService } from "../../images/services/image-service";
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

interface ImageFileInput {
  file: Express.Multer.File;
  altText?: string;
  isPrimary: boolean;
  order: number;
}

export class PropertyService {
  private propertyRepository = new PropertyRepository();
  private availabilityService = new AvailabilityService();
  private peakSeasonService = new PeakSeasonService();
  private propertySearcher: PropertySearcher;
  private imageService = new ImageService();

  constructor() {
    this.propertySearcher = new PropertySearcher(
      this.propertyRepository,
      this.availabilityService,
      this.peakSeasonService
    );
  }

  public async createProperty(
    tenantId: number,
    payload: CreatePropertyDto,
    files?: ImageFileInput[]
  ) {
    const slug = payload.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const repoPayload: PropertyCreateRepoDto = {
      name: payload.name,
      slug,
      description: payload.description,
      category: payload.category as $Enums.PropertyCategory,
      tenant: {
        connect: { id: tenantId },
      },
    };

    const property = await this.propertyRepository.create(repoPayload);

    if (files && files.length > 0) {
      await this.imageService.handleCreateImages(
        "property",
        property.id,
        files
      );
    }

    return this.propertyRepository.findById(property.id);
  }

  public async updateProperty(
    tenantId: number,
    propertyId: number,
    data: UpdatePropertyDto,
    files?: ImageFileInput[]
  ) {
    const existing = await this.propertyRepository.findById(propertyId);
    if (!existing) throw new ApiError("Property not found", 404);
    if (existing.tenantId !== tenantId)
      throw new ApiError("Not Authorized", 403);

    const { category, ...rest } = data;

    const updateData: Partial<PropertyUpdateRepoDto> = {
      ...rest,
      ...(category && { category: category as $Enums.PropertyCategory }),
    };

    if (data.name && data.name !== existing.name) {
      updateData.slug = data.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
    }

    await this.propertyRepository.update(propertyId, updateData);

    if (files && files.length > 0) {
      await this.imageService.handleUpdateImages("property", propertyId, files);
    }

    const finalUpdatedProperty = await this.propertyRepository.findById(
      propertyId
    );

    if (!finalUpdatedProperty) {
      throw new ApiError("Failed to retrieve updated property", 500);
    }

    return finalUpdatedProperty;
  }

  public async softDeleteProperty(propertyId: number) {
    await this.imageService.handleDeleteImages("property", propertyId);
    return this.propertyRepository.softDelete(propertyId);
  }

  public async getPropertiesByTenant(tenantId: number) {
    return this.propertyRepository.findByTenant(tenantId);
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
        isAvailable,
      };
    });

    (property as any).rooms = roomsWithPrices;

    return property;
  }

  public async searchProperties(params: PropertySearchQueryDto) {
    return this.propertySearcher.search(params);
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
      // service scopes peak seasons to the property's tenant
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
