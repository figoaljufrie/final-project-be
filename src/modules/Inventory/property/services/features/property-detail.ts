import { PeakSeasonQuery } from "@/modules/Inventory/peakseason/services/features/peak-season-query";
import { buildAvailabilityMap } from "@/shared/helpers/build-availability-map";
import { CacheKeys } from "../../../../../shared/helpers/cache-keys";
import { ApiError } from "../../../../../shared/utils/api-error";
import { cacheManager } from "../../../../../shared/utils/redis/cache-manager";
import { cacheConfig } from "../../../../../shared/utils/redis/redis-config";
import { AvailabilityService } from "../../../availability/services/availability-service";
import {
  checkRoomRangeAvailability,
  getPropertyDateRange,
} from "../../helpers/property-helpers";
import { PropertyRepository } from "../../repository/property-repository";

export class PropertyDetailsService {
  private propertyRepository = new PropertyRepository();
  private availabilityService = new AvailabilityService();
  private peakSeasonQuery= new PeakSeasonQuery();

  public async getPropertyDetails(
    propertyId: number,
    checkInDate?: Date,
    checkOutDate?: Date
  ) {
    const cacheKey = CacheKeys.propertyDetails(
      propertyId,
      checkInDate,
      checkOutDate
    );

    return cacheManager.getOrSet(
      cacheKey,
      async () => {
        console.log("⚙️ Fetching property details from database...");
        return await this.fetchPropertyDetails(
          propertyId,
          checkInDate,
          checkOutDate
        );
      },
      cacheConfig.propertyDetailsTTL
    );
  }

  private async fetchPropertyDetails(
    propertyId: number,
    checkInDate?: Date,
    checkOutDate?: Date
  ) {
    const property = await this.propertyRepository.findByIdWithRooms(
      propertyId
    );
    if (!property) throw new ApiError("Property not found", 404);

    if (!checkInDate || !checkOutDate) return property;
    if (checkInDate >= checkOutDate)
      throw new ApiError("Check-out date must be after check-in date.", 400);

    const roomIds = property.rooms.map((r) => r.id);
    const dateRange = getPropertyDateRange(checkInDate, checkOutDate, false);

    const [peakSeasons, availabilityData] = await Promise.all([
      this.peakSeasonQuery.findActivePeakSeasonsForProperty(
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
}
