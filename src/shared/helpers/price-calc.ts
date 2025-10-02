import { RoomAvailability, PeakSeason } from "../../generated/prisma";


export interface CalculatedPrice {
  available: boolean;
  price: number | null;
}

/**
 * Calculates the final price of a room for a specific day based on base price,
 * availability overrides, and peak season modifiers. This is a PURE FUNCTION.
 *
 * @param basePrice The room's default price.
 * @param availability Daily availability record (RoomAvailability).
 * @param peakSeasons Array of applicable peak season rules.
 * @returns An object with the final price and availability status.
 */
export function calculateFinalRoomPrice(
  basePrice: number,
  availability: RoomAvailability | null,
  peakSeasons: PeakSeason[] = []
): CalculatedPrice {
  if (availability && availability.isAvailable === false) {
    return { available: false, price: null };
  }

  let price =
    availability && typeof availability.customPrice === "number"
      ? availability.customPrice
      : basePrice;

  if (availability && typeof availability.priceModifier === "number") {
    price = price * (1 + availability.priceModifier / 100);
  }

  for (const ps of peakSeasons) {
    if (ps.changeType === "nominal") {
      price = price + ps.changeValue;
    } else {
      price = price * (1 + ps.changeValue / 100);
    }
  }
  price = Math.round(price);

  return { available: true, price };
}
