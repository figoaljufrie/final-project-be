import {
  RoomAvailability as PrismaRoomAvailability,
  PeakSeason,
} from "../../../generated/prisma";
import { calculateFinalRoomPrice } from "../../../shared/helpers/price-calc";

type RoomAvailabilityType = PrismaRoomAvailability;

export interface PriceAvailabilityResult {
  isAvailable: boolean;
  minPrice: number;
}

export function getDateRange(
  start: Date,
  end: Date,
  includeEnd: boolean = false
): Date[] {
  const dates = [];
  let date = new Date(start.getTime());

  while (
    date.getTime() < end.getTime() ||
    (includeEnd && date.getTime() === end.getTime())
  ) {
    dates.push(new Date(date.getTime()));
    date.setDate(date.getDate() + 1);
  }
  return dates;
}

export function buildAvailabilityMap(
  allAvailability: RoomAvailabilityType[]
): Map<string, RoomAvailabilityType> {
  const map = new Map<string, RoomAvailabilityType>();
  for (const avail of allAvailability) {
    const key = `${avail.roomId}-${avail.date.toISOString().split("T")[0]}`;
    map.set(key, avail);
  }
  return map;
}

export function checkRoomRangeAvailability(
  roomId: number,
  basePrice: number,
  dateRange: Date[],
  availMap: Map<string, RoomAvailabilityType>,
  peakSeasons: PeakSeason[]
): PriceAvailabilityResult {
  let isAvailable = true;
  let minPrice = Infinity;

  for (const date of dateRange) {
    const dateKey = date.toISOString().split("T")[0];

    const availability = availMap.get(`${roomId}-${dateKey}`) ?? null;

    const isBooked = availability ? availability.bookedUnits >= 1 : false;

    if (isBooked || (availability && availability.isAvailable === false)) {
      isAvailable = false;
      break;
    }

    const activePeakSeasons = peakSeasons.filter(
      (ps) => date >= ps.startDate && ps.endDate && date <= ps.endDate
    );

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
