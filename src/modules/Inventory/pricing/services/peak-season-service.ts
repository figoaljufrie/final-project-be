import { Prisma } from "../../../../generated/prisma";
import { CacheKeys } from "../../../../shared/helpers/cache-keys";
import { ApiError } from "../../../../shared/utils/api-error";
import { cacheManager } from "../../../../shared/utils/redis/cache-manager";
import { PropertyRepository } from "../../property/repository/property-repository";
import { RoomRepository } from "../../room/repository/room-repository";
import {
  CreatePeakSeasonDto,
  PeakSeasonDto,
  PeakSeasonRepoCreateDto,
  UpdatePeakSeasonDto,
} from "../dto/availability-dto";
import { PeakSeasonAvailabilityApplier } from "../helpers/peak-season-helpers";
import { validatePeakSeasonPayload } from "../helpers/pricing-helpers";
import { AvailabilityRepository } from "../repository/availability-repository";
import { PeakSeasonRepository } from "../repository/peak-season-repository";

export class PeakSeasonService {
  private peakSeasonRepository = new PeakSeasonRepository();
  private availabilityRepository = new AvailabilityRepository();
  private propertyRepository = new PropertyRepository();
  private roomRepository = new RoomRepository() as any;
  private peakSeasonApplier: PeakSeasonAvailabilityApplier;

  constructor() {
    this.peakSeasonApplier = new PeakSeasonAvailabilityApplier(
      this.propertyRepository,
      this.roomRepository,
      this.availabilityRepository,
      this.peakSeasonRepository
    );
  }

  public async createPeakSeason(
    tenantId: number,
    payload: CreatePeakSeasonDto
  ) {
    const { startDate, endDate } = await validatePeakSeasonPayload(
      tenantId,
      payload,
      this.propertyRepository
    );

    const hasOverlap = await this.peakSeasonRepository.hasOverlapped(
      tenantId,
      startDate,
      endDate,
      payload.propertyIds,
      payload.applyToAllProperties
    );

    if (hasOverlap) {
      throw new ApiError(
        "Peak season overlaps with an existing peak season for the specified properties.",
        400
      );
    }

    const data: PeakSeasonRepoCreateDto = {
      tenantId,
      name: payload.name,
      startDate,
      endDate,
      changeType: payload.changeType,
      changeValue: payload.changeValue,
      applyToAllProperties: payload.applyToAllProperties,
      propertyIds: payload.propertyIds || [],
    };

    const createdPeakSeason = await this.peakSeasonRepository.createPeakSeason(
      data as any
    );

    await this.peakSeasonApplier.applyChanges(createdPeakSeason);

    // ✅ FIX: Ensure propertyIds is always an array
    await this.invalidatePeakSeasonCaches(tenantId, payload.propertyIds || []);

    return createdPeakSeason;
  }

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

  public async updatePeakSeason(
    tenantId: number,
    id: number,
    payload: UpdatePeakSeasonDto
  ) {
    const existing =
      await this.peakSeasonRepository.findExistingPeakSeasonForUpdate(
        id,
        tenantId
      );

    if (!existing) {
      throw new ApiError("Peak Season not found or not owned by tenant.", 404);
    }

    const { startDate, endDate } = await validatePeakSeasonPayload(
      tenantId,
      payload,
      this.propertyRepository
    );

    const hasOverlap = await this.peakSeasonRepository.hasOverlapped(
      tenantId,
      startDate ?? existing.startDate,
      endDate ?? existing.endDate,
      payload.propertyIds ?? existing.propertyIds,
      payload.applyToAllProperties ?? existing.applyToAllProperties,
      id
    );

    if (hasOverlap) {
      throw new ApiError(
        "Updated peak season would overlap with an existing peak season for the specified properties.",
        400
      );
    }

    const updateData: Partial<Prisma.PeakSeasonUpdateInput> = {};

    if (payload.name !== undefined) updateData.name = payload.name;
    if (startDate !== undefined) updateData.startDate = startDate;
    if (endDate !== undefined) updateData.endDate = endDate;
    if (payload.changeType !== undefined)
      updateData.changeType = payload.changeType;
    if (payload.changeValue !== undefined)
      updateData.changeValue = payload.changeValue;
    if (payload.applyToAllProperties !== undefined)
      updateData.applyToAllProperties = payload.applyToAllProperties;
    if (payload.propertyIds !== undefined)
      updateData.propertyIds = payload.propertyIds;

    const updatedPeakSeason = await this.peakSeasonRepository.updatePeakSeason(
      id,
      updateData
    );

    await this.peakSeasonApplier.applyChanges(updatedPeakSeason, existing);

    // ✅ FIX: Ensure propertyIds is always an array
    const affectedPropertyIds = [
      ...(payload.propertyIds || existing.propertyIds),
    ];
    await this.invalidatePeakSeasonCaches(tenantId, affectedPropertyIds);

    return updatedPeakSeason;
  }

  public async deletePeakSeason(tenantId: number, id: number) {
    const existing =
      await this.peakSeasonRepository.findExistingPeakSeasonForUpdate(
        id,
        tenantId
      );

    if (!existing) {
      throw new ApiError("Peak Season not found or not owned by tenant.", 404);
    }

    const deletedPeakSeason = existing;

    await this.peakSeasonApplier.applyChanges(
      deletedPeakSeason,
      existing,
      true
    );

    // ✅ No change needed here - existing.propertyIds is already number[]
    await this.invalidatePeakSeasonCaches(tenantId, existing.propertyIds);

    return { message: "Peak season deleted successfully." };
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
  ): Promise<PeakSeasonDto[]> {
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
  ): Promise<PeakSeasonDto[]> {
    return this.peakSeasonRepository.findRelevantPeakSeasonsForTenantRange(
      tenantId,
      startDate,
      endDate
    ) as Promise<PeakSeasonDto[]>;
  }

  private async invalidatePeakSeasonCaches(
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

      await cacheManager.deletePattern(
        CacheKeys.patterns.allAvailabilityCache()
      );

      await cacheManager.deletePattern(CacheKeys.patterns.allSearchCache());

      console.log(`🗑️ Invalidated peak season caches for tenant ${tenantId}`);
    } catch (error) {
      console.error("Cache invalidation error:", error);
    }
  }
}
