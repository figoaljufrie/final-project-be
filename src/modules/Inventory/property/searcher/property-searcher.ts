import { AvailabilityService } from "../../pricing/services/availability-service";
import { PeakSeasonService } from "../../pricing/services/peak-season-service";
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
    peakSeasonService: PeakSeasonService
  ) {
    this.cacheManager = new SearchCacheManager();
    this.executor = new SearchExecutor(
      propertyRepository,
      availabilityService,
      peakSeasonService
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
