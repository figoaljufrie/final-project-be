import { CacheKeys } from "@/shared/helpers/cache-keys";
import { cacheManager } from "@/shared/utils/redis/cache-manager";
import { PropertyRepository } from "@/modules/Inventory/property/repository/property-repository";
import { PeakSeasonRepository } from "../../repository/peak-season-repository";
import { PeakSeasonDto } from "../../dto/peak-season-dto";

export class PeakSeasonQuery {
  private peakSeasonRepository = new PeakSeasonRepository();
  private propertyRepository = new PropertyRepository();

  public async listPeakSeasonsByTenant(tenantId: number) {
    const cacheKey = CacheKeys.peakSeasonsTenant(tenantId);
    return cacheManager.getOrSet(
      cacheKey,
      async () => {
        console.log("⚙️ Fetching peak seasons from database...");
        return await this.peakSeasonRepository.findPeakSeasonByTenant(tenantId);
      },
      1800
    );
  }

  public async findActivePeakSeasonsForProperty(
    propertyId: number,
    startDate: Date,
    endDate: Date
  ) {
    const property = await this.propertyRepository.findById(propertyId);
    const tenantId = property?.tenantId;
    return this.peakSeasonRepository.findActivePeakSeasonsForPropertyRange(
      propertyId,
      startDate,
      endDate,
      tenantId
    ) as Promise<PeakSeasonDto[]>;
  }

  public async findPeakSeasonsForPropertyRange(
    propertyId: number,
    startDate: Date,
    endDate: Date
  ) {
    const property = await this.propertyRepository.findById(propertyId);
    const tenantId = property?.tenantId;
    return this.peakSeasonRepository.findForPropertyInRange(
      propertyId,
      startDate,
      endDate,
      tenantId
    );
  }

  public async findAllRelevantPeakSeasonsForRange(
    startDate: Date,
    endDate: Date,
    tenantId?: number
  ) {
    return this.peakSeasonRepository.findAllRelevantPeakSeasonsForRange(
      startDate,
      endDate,
      tenantId
    ) as Promise<PeakSeasonDto[]>;
  }

  public async findRelevantPeakSeasonsForTenantRange(
    tenantId: number,
    startDate: Date,
    endDate: Date
  ) {
    return this.peakSeasonRepository.findRelevantPeakSeasonsForTenantRange(
      tenantId,
      startDate,
      endDate
    ) as Promise<PeakSeasonDto[]>;
  }
}