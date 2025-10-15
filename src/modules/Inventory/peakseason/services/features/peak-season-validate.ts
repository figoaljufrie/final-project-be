import { ApiError } from "@/shared/utils/api-error";
import { PropertyRepository } from "@/modules/Inventory/property/repository/property-repository";
import { toLocalMidnight } from "@/shared/helpers/date-utils";

export interface ValidatedPeakSeasonDates {
  startDate: Date;
  endDate: Date;
}

export async function validatePeakSeasonPayload(
  tenantId: number,
  payload: any,
  propertyRepository: PropertyRepository
): Promise<ValidatedPeakSeasonDates> {
  if (!payload.name) throw new ApiError("Peak Season name is required.", 400);

  const startDate = new Date(payload.startDate);
  const endDate = new Date(payload.endDate);

  if (
    isNaN(startDate.getTime()) ||
    isNaN(endDate.getTime()) ||
    startDate > endDate
  ) {
    throw new ApiError("Invalid date range.", 400);
  }

  if (!payload.applyToAllProperties && payload.propertyIds?.length > 0) {
    const propertyIds: number[] = payload.propertyIds;
    const tenantProperties = await propertyRepository.findByTenant(tenantId);
    const ownedIds = tenantProperties.map((p) => p.id);

    const invalidIds = propertyIds.filter((id) => !ownedIds.includes(id));
    if (invalidIds.length > 0) {
      throw new ApiError(
        "Cannot apply peak season to unowned properties.",
        403
      );
    }
  }

  const localStart = toLocalMidnight(startDate);
  const localEnd = toLocalMidnight(endDate);

  return { startDate: localStart, endDate: localEnd };
}
