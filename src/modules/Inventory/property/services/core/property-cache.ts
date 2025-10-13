import { CacheKeys } from "../../../../../shared/helpers/cache-keys";
import { cacheManager } from "../../../../../shared/utils/redis/cache-manager";

export class PropertyCacheService {
  public async invalidatePropertyCaches(propertyId: number): Promise<void> {
    try {
      await cacheManager.deletePattern(
        CacheKeys.patterns.allPropertyCache(propertyId)
      );
      await cacheManager.deletePattern(
        CacheKeys.patterns.allCalendarCache(propertyId)
      );
      await cacheManager.deletePattern(CacheKeys.patterns.allSearchCache());
      console.log(`🗑️ Invalidated caches for property ${propertyId}`);
    } catch (error) {
      console.error("Cache invalidation error:", error);
    }
  }
}
