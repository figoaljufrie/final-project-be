import { AvailabilityService } from "../../availability/services/availability-service";
import { PeakSeasonQuery } from "../../peakseason/services/features/peak-season-query";
import { PropertySearchQueryDto, SearchResultDto } from "../dto/property-dto";
import { PropertyRepository } from "../repository/property-repository";
import { SearchCacheManager } from "./search-cache";
import { SearchExecutor } from "./search-executor";

export class PropertySearcher {
  private cacheManager: SearchCacheManager;
  private executor: SearchExecutor;

  constructor(
    propertyRepository: PropertyRepository,
    availabilityService: AvailabilityService,
    peakSeasonQuery: PeakSeasonQuery
  ) {
    this.cacheManager = new SearchCacheManager();
    this.executor = new SearchExecutor(
      propertyRepository,
      availabilityService,
      peakSeasonQuery
    );
  }

  public async search(
    params: PropertySearchQueryDto
  ): Promise<SearchResultDto> {
    return this.cacheManager.cachedSearch(params, async () => {
      return await this.executor.executeSearch(params);
    });
  }

  public async invalidateSearchCache(): Promise<void> {
    await this.cacheManager.invalidateSearchCache();
  }
}
