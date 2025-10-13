import { CacheKeys } from "../../../../shared/helpers/cache-keys";
import { cacheManager } from "../../../../shared/utils/redis/cache-manager";

export class RoomCacheService {
  /**
   * Invalidate all caches related to rooms and their property
   */
  public async invalidateRoomCaches(propertyId: number): Promise<void> {
    try {
      // Invalidate rooms cache
      await cacheManager.delete(CacheKeys.roomsByProperty(propertyId));

      // Invalidate property caches (details, calendar)
      await cacheManager.deletePattern(
        CacheKeys.patterns.allPropertyCache(propertyId)
      );

      // Invalidate calendar cache
      await cacheManager.deletePattern(
        CacheKeys.patterns.allCalendarCache(propertyId)
      );

      // Invalidate search cache (room changes affect search results)
      await cacheManager.deletePattern(CacheKeys.patterns.allSearchCache());

      // Invalidate availability cache
      await cacheManager.deletePattern(
        CacheKeys.patterns.allAvailabilityCache()
      );

      console.log(`🗑️ Invalidated caches for property ${propertyId} rooms`);
    } catch (error) {
      console.error("Cache invalidation error:", error);
    }
  }
}