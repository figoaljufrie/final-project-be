import { RoomAvailability as PrismaRoomAvailability } from "../../../../generated/prisma";
import { CacheKeys } from "../../../../shared/helpers/cache-keys";
import paginate from "../../../../shared/helpers/pagination";
import { cacheManager } from "../../../../shared/utils/redis/cache-manager";
import { cacheConfig } from "../../../../shared/utils/redis/redis-config";
import { PeakSeasonDto } from "../../pricing/dto/availability-dto";
import { AvailabilityService } from "../../pricing/services/availability-service";
import { PeakSeasonService } from "../../pricing/services/peak-season-service";
import {
  buildAvailabilityMap,
  checkRoomRangeAvailability,
  getDateRange,
} from "../../property/helpers/property-helpers";
import {
  PriceSort,
  PropertyListItemDto,
  PropertySearchQueryDto,
  PropertySearchRepoParamsDto,
  PropertySortField,
} from "../dto/property-dto";
import { PropertyRepository } from "../repository/property-repository";

type RoomAvailabilityType = PrismaRoomAvailability;

interface RoomForPricing {
  id: number;
  basePrice: number;
}

// ✅ EXPORT this interface so property-service.ts can use it
export interface SearchResult {
  properties: Array<{
    id: number;
    name: string;
    city: string | null;
    category: string;
    minPrice: number | null;
    image: string | undefined;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export class PropertySearcher {
  private propertyRepository: PropertyRepository;
  private availabilityService: AvailabilityService;
  private peakSeasonService: PeakSeasonService;

  constructor(
    propertyRepository: PropertyRepository,
    availabilityService: AvailabilityService,
    peakSeasonService: PeakSeasonService
  ) {
    this.propertyRepository = propertyRepository;
    this.availabilityService = availabilityService;
    this.peakSeasonService = peakSeasonService;
  }

  public async search(params: PropertySearchQueryDto): Promise<SearchResult> {
    const cacheKey = CacheKeys.search(params);

    console.log(`🔍 Searching properties with cache key: ${cacheKey}`);

    return cacheManager.getOrSet(
      cacheKey,
      async () => {
        console.log("⚙️ Executing database search...");
        return await this.executeSearch(params);
      },
      cacheConfig.searchTTL
    );
  }

  private async executeSearch(
    params: PropertySearchQueryDto
  ): Promise<SearchResult> {
    const { skip, limit: take } = paginate(params.page, params.limit);

    const whereClause: any = {
      deletedAt: null,
      published: true,
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

  private async filterAndPriceProperties(
    properties: PropertyListItemDto[],
    checkInDate: Date,
    checkOutDate: Date
  ): Promise<PropertyListItemDto[]> {
    const allRoomIds = properties.flatMap((p) =>
      p.rooms.map((r: RoomForPricing) => r.id)
    );
    const dateRange = getDateRange(checkInDate, checkOutDate, false);

    const availabilityCacheKey = CacheKeys.availabilityBulk(
      allRoomIds,
      checkInDate,
      checkOutDate
    );

    const allAvailability = (await cacheManager.getOrSet(
      availabilityCacheKey,
      async () => {
        console.log("⚙️ Fetching availability from database...");
        return await this.availabilityService.getBulkAvailabilityForRooms(
          allRoomIds,
          checkInDate,
          checkOutDate
        );
      },
      cacheConfig.defaultTTL
    )) as RoomAvailabilityType[];

    // ✅ FIX: Remove 'await' and 'as Promise<>' - the function already returns Promise
    const peakSeasons =
      await this.peakSeasonService.findAllRelevantPeakSeasonsForRange(
        checkInDate,
        checkOutDate
      );

    const availMap = buildAvailabilityMap(allAvailability);
    const availableProperties: PropertyListItemDto[] = [];

    for (const prop of properties) {
      // ✅ FIX: Remove 'await' since peakSeasons is already resolved
      const relevantPeakSeasons: PeakSeasonDto[] = peakSeasons
        .filter(
          (ps) =>
            ps.applyToAllProperties ||
            (ps.propertyIds as number[]).includes(prop.id)
        )
        .filter((ps) => {
          return (ps as any).tenantId === (prop as any).tenantId;
        });

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

  public async invalidateSearchCache(): Promise<void> {
    const pattern = CacheKeys.patterns.allSearchCache();
    await cacheManager.deletePattern(pattern);
    console.log("🗑️ Search cache invalidated");
  }
}
