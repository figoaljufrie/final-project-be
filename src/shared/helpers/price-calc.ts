import { Room, RoomAvailability, PeakSeason } from "../../generated/prisma";

export function computeRoomPrice(
  basePrice: number,
  availability: RoomAvailability | null,
  peakSeasons: PeakSeason[] = []
) {
  if (availability && availability.isAvailable === false) {
    return { available: false, price: null };
  }

  let price =
    availability && typeof availability.customPrice === "number"
      ? availability.customPrice
      : basePrice;

  if (availability && typeof availability.priceModifier === "number") {
    price = Math.round(price * (1 + availability.priceModifier / 100));
  }

  for (const ps of peakSeasons) {
    if (ps.changeType === "nominal") {
      price = Math.round(price + ps.changeValue);
    } else {
      price = Math.round(price * (1 + ps.changeValue / 100));
    }
  }

  return { available: true, price };
}
