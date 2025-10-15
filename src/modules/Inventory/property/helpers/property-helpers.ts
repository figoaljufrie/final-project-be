import {
  PeakSeason,
  RoomAvailability as PrismaRoomAvailability,
} from "../../../../generated/prisma";
import { calculateFinalRoomPrice } from "../../../../shared/helpers/price-calc";
import { toLocalMidnight } from "../../../../shared/helpers/date-utils";

type RoomAvailabilityType = PrismaRoomAvailability;

export interface PriceAvailabilityResult {
  isAvailable: boolean;
  minPrice: number;
}

// --- MAIN FIX HERE ---
// Ensure all generated dates are set to local midnight consistently
export function getPropertyDateRange(
  start: Date,
  end: Date,
  includeEnd: boolean = false
): Date[] {
  const dates: Date[] = [];
  let date = toLocalMidnight(start);

  const endDate = toLocalMidnight(end);

  while (
    date.getTime() < endDate.getTime() ||
    (includeEnd && date.getTime() === endDate.getTime())
  ) {
    dates.push(new Date(date.getTime()));
    date.setDate(date.getDate() + 1);
    date = toLocalMidnight(date);
  }

  return dates;
}

// --- ALSO ADJUSTED THIS TO USE toLocalMidnight(date) WHEN COMPARING ---
export function checkRoomRangeAvailability(
  roomId: number,
  basePrice: number,
  dateRange: Date[],
  availMap: Map<string, RoomAvailabilityType>,
  peakSeasons: PeakSeason[]
): PriceAvailabilityResult {
  let isAvailable = true;
  let minPrice = Infinity;

  for (const rawDate of dateRange) {
    const date = toLocalMidnight(rawDate); // ensure comparison consistency
    const dateKey = date.toISOString().split("T")[0];

    const availability = availMap.get(`${roomId}-${dateKey}`) ?? null;
    const isBooked = availability ? availability.bookedUnits >= 1 : false;

    if (isBooked || (availability && availability.isAvailable === false)) {
      isAvailable = false;
      break;
    }

    const activePeakSeasons = peakSeasons.filter((ps) => {
      const start = toLocalMidnight(ps.startDate);
      const end = ps.endDate ? toLocalMidnight(ps.endDate) : null;
      return date >= start && end && date <= end;
    });

    const { price: dailyPrice } = calculateFinalRoomPrice(
      basePrice,
      availability as RoomAvailabilityType | null,
      activePeakSeasons
    );

    if (dailyPrice !== null && dailyPrice < minPrice) {
      minPrice = dailyPrice;
    }
  }

  return {
    isAvailable,
    minPrice: isAvailable ? minPrice : 0,
  };
}
