import { RoomAvailability as PrismaRoomAvailability } from "../../../../generated/prisma";
import { CacheKeys } from "../../../../shared/helpers/cache-keys";
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
import { PropertyListItemDto } from "../dto/property-dto";

type RoomAvailabilityType = PrismaRoomAvailability;
interface RoomForPricing {
  id: number;
  basePrice: number;
}

export class FilterAndPriceService {
  private availabilityService: AvailabilityService;
  private peakSeasonService: PeakSeasonService;

  constructor(
    availabilityService: AvailabilityService,
    peakSeasonService: PeakSeasonService
  ) {
    this.availabilityService = availabilityService;
    this.peakSeasonService = peakSeasonService;
  }

  public async filterAndPriceProperties(
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

    const peakSeasons =
      await this.peakSeasonService.findAllRelevantPeakSeasonsForRange(
        checkInDate,
        checkOutDate
      );

    const availMap = buildAvailabilityMap(allAvailability);
    const availableProperties: PropertyListItemDto[] = [];

    for (const prop of properties) {
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
}
