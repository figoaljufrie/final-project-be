import { CacheKeys } from "../../../../shared/helpers/cache-keys";
import { cacheManager } from "../../../../shared/utils/redis/cache-manager";
import { cacheConfig } from "../../../../shared/utils/redis/redis-config";
import { PropertySearchQueryDto, SearchResultDto } from "../dto/property-dto";

export class SearchCacheManager {
  public async cachedSearch(
    params: PropertySearchQueryDto,
    executeSearch: () => Promise<SearchResultDto>
  ): Promise<SearchResultDto> {
    const cacheKey = CacheKeys.search(params);
    console.log(`🔍 Searching properties with cache key: ${cacheKey}`);

    return cacheManager.getOrSet(
      cacheKey,
      async () => {
        console.log("⚙️ Executing database search...");
        return await executeSearch();
      },
      cacheConfig.searchTTL
    );
  }

  public async invalidateSearchCache(): Promise<void> {
    const pattern = CacheKeys.patterns.allSearchCache();
    await cacheManager.deletePattern(pattern);
    console.log("🗑️ Search cache invalidated");
  }
}
