import { Prisma } from "../../../../generated/prisma";
import { ApiError } from "../../../../shared/utils/api-error";
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

    const data: PeakSeasonRepoCreateDto = {
      tenantId,
      name: payload.name,
      startDate: startDate,
      endDate: endDate,
      changeType: payload.changeType,
      changeValue: payload.changeValue,
      applyToAllProperties: payload.applyToAllProperties,
      propertyIds: payload.propertyIds || [],
    };

    const createdPeakSeason = await this.peakSeasonRepository.createPeakSeason(
      data as any
    );

    await this.peakSeasonApplier.applyChanges(createdPeakSeason);

    return createdPeakSeason;
  }

  public async listPeakSeasonsByTenant(tenantId: number) {
    return this.peakSeasonRepository.findPeakSeasonByTenant(tenantId);
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
    // REMOVED: priority line

    const updatedPeakSeason = await this.peakSeasonRepository.updatePeakSeason(
      id,
      updateData
    );

    await this.peakSeasonApplier.applyChanges(updatedPeakSeason, existing);

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

    return { message: "Peak season deleted successfully." };
  }

  public async findActivePeakSeasonsForProperty(
    propertyId: number,
    startDate: Date,
    endDate: Date
  ) {
    return this.peakSeasonRepository.findActivePeakSeasonsForPropertyRange(
      propertyId,
      startDate,
      endDate
    ) as Promise<PeakSeasonDto[]>;
  }

  public async findAllRelevantPeakSeasonsForRange(
    startDate: Date,
    endDate: Date
  ): Promise<PeakSeasonDto[]> {
    return this.peakSeasonRepository.findAllRelevantPeakSeasonsForRange(
      startDate,
      endDate
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
}
