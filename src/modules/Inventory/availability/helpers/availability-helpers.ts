import {
  CalculatedPrice,
  calculateFinalRoomPrice,
} from "../../../../shared/helpers/price-calc";
import { PeakSeasonDto } from "../../peakseason/dto/peak-season-dto";
import {
  PriceCalculationResult,
  RoomAvailabilityDto,
} from "../dto/availability-dto";
import { toLocalMidnight } from "@/shared/helpers/date-utils";

export interface DateRangeResult {
  dateRange: Date[];
  dateRangeStart: Date;
  dateRangeEnd: Date;
}

export function getAvailabilityDateRange(
  start: Date,
  end: Date,
  inclusive: boolean = true
): Date[] {
  const dates = [];
  const current = toLocalMidnight(new Date(start));
  const endOfDay = toLocalMidnight(new Date(end));

  while (current <= endOfDay) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  return dates;
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
    const seasonNames = activePeakSeasons.map((s) => s.name).join(" + ");
    reason = `Peak Season: ${seasonNames}`;
  }

  return {
    priceModifier: existingAvail?.priceModifier ?? null,
    customPrice: calculatedResult.price,
    reason,
  };
}
