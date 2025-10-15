import { CacheKeys } from "@/shared/helpers/cache-keys";
import { cacheManager } from "@/shared/utils/redis/cache-manager";

export async function invalidatePeakSeasonCaches(
  tenantId: number,
  propertyIds: number[]
): Promise<void> {
  try {
    await cacheManager.delete(CacheKeys.peakSeasonsTenant(tenantId));

    await cacheManager.deletePattern(
      CacheKeys.patterns.allPeakSeasonsCache(tenantId)
    );

    for (const propertyId of propertyIds) {
      await cacheManager.deletePattern(
        CacheKeys.patterns.allPropertyCache(propertyId)
      );
      await cacheManager.deletePattern(
        CacheKeys.patterns.allCalendarCache(propertyId)
      );
    }

    await cacheManager.deletePattern(CacheKeys.patterns.allAvailabilityCache());
    await cacheManager.deletePattern(CacheKeys.patterns.allSearchCache());

    console.log(`🗑️ Invalidated peak season caches for tenant ${tenantId}`);
  } catch (error) {
    console.error("Cache invalidation error:", error);
  }
}
