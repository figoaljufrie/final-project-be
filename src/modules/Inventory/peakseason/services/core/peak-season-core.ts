import { PropertyRepository } from "@/modules/Inventory/property/repository/property-repository";
import { PeakSeasonRepository } from "../../repository/peak-season-repository";
import { Prisma } from "../../../../../generated/prisma";
import { ApiError } from "../../../../../shared/utils/api-error";
import {
  CreatePeakSeasonDto,
  UpdatePeakSeasonDto,
} from "../../dto/peak-season-dto";
import { validatePeakSeasonPayload } from "../features/peak-season-validate";
import { PeakSeasonSyncService } from "../features/peak-season-sync";

export class PeakSeasonService {
  private peakSeasonRepository = new PeakSeasonRepository();
  private propertyRepository = new PropertyRepository();
  private peakSeasonSyncService = new PeakSeasonSyncService();

  public async createPeakSeason(
    tenantId: number,
    payload: CreatePeakSeasonDto
  ) {
    const { startDate, endDate } = await validatePeakSeasonPayload(
      tenantId,
      payload,
      this.propertyRepository
    );

    const overlappingSeasons = await this.peakSeasonRepository.hasOverlapped(
      tenantId,
      startDate,
      endDate,
      payload.propertyIds,
      payload.applyToAllProperties
    );

    if (overlappingSeasons.length > 0) {
      console.log(
        `ℹ️ Peak season will stack with ${overlappingSeasons.length} existing season(s)`
      );
    }

    const data = {
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

    await this.peakSeasonSyncService.applyAfterCreate(
      tenantId,
      createdPeakSeason,
      payload.propertyIds || []
    );

    return createdPeakSeason;
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
    if (!existing)
      throw new ApiError("Peak Season not found or not owned by tenant.", 404);

    const { startDate, endDate } = await validatePeakSeasonPayload(
      tenantId,
      payload,
      this.propertyRepository
    );

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

    await this.peakSeasonSyncService.applyAfterUpdate(
      tenantId,
      updatedPeakSeason,
      existing,
      payload.propertyIds || existing.propertyIds
    );

    return updatedPeakSeason;
  }

  public async deletePeakSeason(tenantId: number, id: number) {
    const existing =
      await this.peakSeasonRepository.findExistingPeakSeasonForUpdate(
        id,
        tenantId
      );
    if (!existing)
      throw new ApiError("Peak Season not found or not owned by tenant.", 404);

    await this.peakSeasonSyncService.applyAfterDelete(
      tenantId,
      existing,
      existing.propertyIds
    );

    // ✅ Actually delete the record
    await this.peakSeasonRepository.deletePeakSeason(id);

    return { message: "Peak season deleted successfully." };
  }
}
