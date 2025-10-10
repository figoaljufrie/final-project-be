import {
  CalculatedPrice,
  calculateFinalRoomPrice,
} from "../../../../shared/helpers/price-calc";
import { ApiError } from "../../../../shared/utils/api-error";
import { PropertyRepository } from "../../property/repository/property-repository";
import {
  PeakSeasonDto,
  PriceCalculationResult,
  RoomAvailabilityDto,
} from "../dto/availability-dto";

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
  inclusive: boolean = true
): Date[] {
  const dates = [];
  const date = new Date(start);
  date.setHours(0, 0, 0, 0);

  const endOfDay = new Date(end);
  endOfDay.setHours(0, 0, 0, 0);

  while (date <= endOfDay) {
    dates.push(new Date(date));
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
    const lastPeakSeason = activePeakSeasons[activePeakSeasons.length - 1]!;
    reason = `Peak Season: ${lastPeakSeason.name}`;
  }

  return {
    priceModifier: existingAvail?.priceModifier ?? null,
    customPrice: calculatedResult.price,
    reason,
  };
}

function toLocalMidnight(date: Date): Date {
  const adjusted = new Date(date);
  adjusted.setMinutes(adjusted.getMinutes() - adjusted.getTimezoneOffset());
  adjusted.setHours(0, 0, 0, 0);
  return adjusted;
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
