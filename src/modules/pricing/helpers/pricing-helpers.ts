import {
  PeakSeasonDto,
  RoomAvailabilityDto,
  RoomForPricing,
  PriceCalculationResult,
} from "../dto/availability-dto";
import {
  CalculatedPrice,
  calculateFinalRoomPrice,
} from "../../../shared/helpers/price-calc";
import { ApiError } from "../../../shared/utils/api-error";
import { PropertyRepository } from "../../property/repository/property-repository";

export interface DateRangeResult {
  dateRange: Date[];
  dateRangeStart: Date;
  dateRangeEnd: Date;
}

export interface ValidatedPeakSeasonDates {
  startDate: Date;
  endDate: Date;
}

export function getDateRange(
  start: Date,
  end: Date,
  inclusive: boolean = false
): Date[] {
  const dates = [];
  let date = new Date(start.getTime());
  date.setHours(0, 0, 0, 0);

  const endOfDay = new Date(end.getTime());
  endOfDay.setHours(0, 0, 0, 0);

  while (
    date < endOfDay ||
    (inclusive && date.getTime() === endOfDay.getTime())
  ) {
    dates.push(new Date(date.getTime()));
    date.setDate(date.getDate() + 1);
  }
  return dates;
}

export function buildAvailabilityMap(
  allAvailability: RoomAvailabilityDto[]
): Map<string, RoomAvailabilityDto> {
  const map = new Map<string, RoomAvailabilityDto>();
  for (const avail of allAvailability) {
    const key = `${avail.roomId}-${avail.date.toISOString().split("T")[0]}`;
    map.set(key, avail);
  }
  return map;
}

export function calculateAvailabilityUpdate(
  basePrice: number,
  existingAvail: RoomAvailabilityDto | null,
  activePeakSeasons: PeakSeasonDto[]
): PriceCalculationResult {
  const calculatedResult: CalculatedPrice = calculateFinalRoomPrice(
    basePrice,
    existingAvail,
    activePeakSeasons
  );

  let reason: string | null = null;
  if (activePeakSeasons.length > 0) {
    // FIX: Using non-null assertion operator (!) to guarantee to TypeScript
    // that the element exists after the length check.
    const lastPeakSeason = activePeakSeasons[activePeakSeasons.length - 1]!;
    reason = `Peak Season: ${lastPeakSeason.name}`;
  }

  return {
    priceModifier: existingAvail?.priceModifier ?? null,
    customPrice: calculatedResult.price,
    reason,
  };
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

  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(0, 0, 0, 0);

  return { startDate, endDate };
}