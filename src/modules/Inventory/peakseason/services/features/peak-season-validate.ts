import { ApiError } from "@/shared/utils/api-error";
import { PropertyRepository } from "@/modules/Inventory/property/repository/property-repository";
import { dateFromKey, toLocalMidnight } from "@/shared/helpers/date-utils";

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

  const startDate = dateFromKey(payload.startDate);
  const endDate = dateFromKey(payload.endDate);

  if (startDate > endDate) {
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

  const localStart = new Date(
    Date.UTC(startDate.getFullYear(), startDate.getMonth(), startDate.getDate())
  );
  const localEnd = new Date(
    Date.UTC(endDate.getFullYear(), endDate.getMonth(), endDate.getDate())
  );

  return { startDate: localStart, endDate: localEnd };
}
