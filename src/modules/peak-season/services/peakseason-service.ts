import { ApiError } from "../../../shared/utils/api-error";
import { PeakSeasonRepository } from "../repository/peakseason-repository";

export class PeakSeasonService {
  private peakSeasonRepository = new PeakSeasonRepository();

  public async create(tenantId: number, payload: any) {
    if (!payload.name) throw new ApiError("Name required", 400);
    const created = await this.peakSeasonRepository.create({
      tenantId,
      name: payload.name,
      startDate: new Date(payload.startDate),
      endDate: new Date(payload.endDate),
      changeType: payload.changeType,
      changeValue: payload.changeValue,
      applyToAllProperties: payload.applyToAllProperties ?? false,
      propertyIds: payload.applyToAllProperties
        ? []
        : payload.propertyIds ?? [],
    } as any);
    return created;
  }

  public async listByTenant(tenantId: number) {
    return this.peakSeasonRepository.findByTenant(tenantId);
  }

  public async update(tenantId: number, id: number, data: any) {
    const existing = await this.peakSeasonRepository.findById(id);
    if (!existing) throw new ApiError("Peak season not found", 404);
    if (existing.tenantId !== tenantId)
      throw new ApiError("Not authorized", 403);
    return this.peakSeasonRepository.update(id, {
      name: data.name ?? existing.name,
      startDate: data.startDate ? new Date(data.startDate) : existing.startDate,
      endDate: data.endDate ? new Date(data.endDate) : existing.endDate,
      changeType: data.changeType ?? existing.changeType,
      changeValue: data.changeValue ?? existing.changeValue,
      applyToAllProperties:
        data.applyToAllProperties ?? existing.applyToAllProperties,
      propertyIds: data.applyToAllProperties
        ? []
        : data.propertyIds ?? existing.propertyIds,
    } as any);
  }

  public async delete(tenantId: number, id: number) {
    const existing = await this.peakSeasonRepository.findById(id);
    if (!existing) throw new ApiError("Peak season not found", 404);
    if (existing.tenantId !== tenantId)
      throw new ApiError("Not authorized", 403);
    return this.peakSeasonRepository.delete(id);
  }
}
