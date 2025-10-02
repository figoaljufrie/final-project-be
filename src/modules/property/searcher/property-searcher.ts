import {
  RoomAvailability as PrismaRoomAvailability,
  PeakSeason,
  $Enums,
} from "../../../generated/prisma";
import paginate from "../../../shared/helpers/pagination";
// Updated Imports
import { AvailabilityService } from "../../pricing/services/availability-service";
import { PeakSeasonService } from "../../pricing/services/peak-season-service";
import { PropertyRepository } from "../repository/property-repository";
import {
  PropertySearchQueryDto,
  PropertyListItemDto,
  PropertySortField,
  PriceSort,
  PropertySearchRepoParamsDto,
} from "../dto/property-dto";
import {
  getDateRange,
  buildAvailabilityMap,
  checkRoomRangeAvailability,
} from "../../../shared/helpers/property/property-helpers";
import { PeakSeasonDto } from "../../pricing/dto/availability-dto";

type RoomAvailabilityType = PrismaRoomAvailability;

interface RoomForPricing {
  id: number;
  basePrice: number;
}

export class PropertySearcher {
  private propertyRepository: PropertyRepository;
  private availabilityService: AvailabilityService;
  private peakSeasonService: PeakSeasonService;

  // Updated constructor to accept PeakSeasonService
  constructor(
    propertyRepository: PropertyRepository,
    availabilityService: AvailabilityService,
    peakSeasonService: PeakSeasonService
  ) {
    this.propertyRepository = propertyRepository;
    this.availabilityService = availabilityService;
    this.peakSeasonService = peakSeasonService;
  }

  // Updated signature to accept tenantId
  public async search(tenantId: number, params: PropertySearchQueryDto) {
    const { skip, limit: take } = paginate(params.page, params.limit);

    const whereClause: any = {
      deletedAt: null,
      published: true,
      tenantId: tenantId, // Using the passed tenantId
      ...(params.name && {
        name: { contains: params.name, mode: "insensitive" },
      }),
      ...(params.category && {
        category: params.category,
      }),
    };

    const total = await this.propertyRepository.count(whereClause);

    const sortByRepo =
      params.sortBy === PropertySortField.PRICE
        ? PropertySortField.CREATED_AT
        : params.sortBy;

    const repoParams: PropertySearchRepoParamsDto = {
      whereClause,
      skip,
      take,
      ...(params.sortOrder && { sortOrder: params.sortOrder }),
      ...(sortByRepo && { sortBy: sortByRepo as "name" | "createdAt" }),
    };

    let properties = await this.propertyRepository.findManyForSearch(
      repoParams
    );

    if (params.checkInDate && params.checkOutDate) {
      properties = await this.filterAndPriceProperties(
        properties,
        tenantId, // Pass tenantId
        params.checkInDate,
        params.checkOutDate
      );
    }

    if (params.sortBy === PropertySortField.PRICE) {
      properties.sort((a, b) => {
        const aPrice = a.minBasePrice ?? 0;
        const bPrice = b.minBasePrice ?? 0;
        return params.sortOrder === PriceSort.DESC
          ? bPrice - aPrice
          : aPrice - bPrice;
      });
    }

    const results = properties.map((p) => ({
      id: p.id,
      name: p.name,
      city: p.city,
      category: p.category,
      minPrice: p.minBasePrice,
      image: p.images[0]?.url,
    }));

    return {
      properties: results,
      pagination: {
        page: params.page || 1,
        limit: take,
        total,
        totalPages: Math.ceil(total / take),
      },
    };
  }

  // Updated signature to accept tenantId
  private async filterAndPriceProperties(
    properties: PropertyListItemDto[],
    tenantId: number,
    checkInDate: Date,
    checkOutDate: Date
  ): Promise<PropertyListItemDto[]> {
    const allRoomIds = properties.flatMap((p) =>
      p.rooms.map((r: RoomForPricing) => r.id)
    );
    const dateRange = getDateRange(checkInDate, checkOutDate, false);

    const [peakSeasons, allAvailability] = await Promise.all([
      // Use the new PeakSeasonService method
      this.peakSeasonService.findRelevantPeakSeasonsForRange(
        tenantId,
        checkInDate,
        checkOutDate
      ) as Promise<PeakSeasonDto[]>,
      this.availabilityService.getBulkAvailabilityForRooms(
        allRoomIds,
        checkInDate,
        checkOutDate
      ) as Promise<RoomAvailabilityType[]>,
    ]);

    const availMap = buildAvailabilityMap(allAvailability);
    const availableProperties: PropertyListItemDto[] = [];

    for (const prop of properties) {
      const relevantPeakSeasons: PeakSeasonDto[] = peakSeasons.filter(
        (ps) =>
          ps.applyToAllProperties ||
          (ps.propertyIds as number[]).includes(prop.id)
      );

      let lowestDynamicPrice = Infinity;
      let propertyAvailable = false;
      const roomsForPricing: RoomForPricing[] = prop.rooms || [];

      for (const room of roomsForPricing) {
        const { isAvailable, minPrice } = checkRoomRangeAvailability(
          room.id,
          room.basePrice,
          dateRange,
          availMap,
          relevantPeakSeasons
        );

        if (isAvailable) {
          propertyAvailable = true;
          if (minPrice < lowestDynamicPrice) {
            lowestDynamicPrice = minPrice;
          }
        }
      }

      if (propertyAvailable) {
        availableProperties.push({
          ...prop,
          minBasePrice: lowestDynamicPrice,
        });
      }
    }

    return availableProperties;
  }
}
