import { ApiError } from "../../../shared/utils/api-error";
import { calculateFinalRoomPrice } from "../../../shared/helpers/price-calc";
import { PeakSeasonService } from "../../Inventory/pricing/services/peak-season-service";
import { AvailabilityService } from "../../Inventory/pricing/services/availability-service";

export class BookingCalculationUtils {
  private static peakSeasonService = new PeakSeasonService();
  private static availabilityService = new AvailabilityService();

  // Advanced calculation using Feature 1's pricing logic
  static async calculateTotalAmount(room: any, dates: Date[], unitCount: number): Promise<number> {
    let totalAmount = 0;

    // Get property ID from room
    const propertyId = room.propertyId;
    if (!propertyId) {
      throw new ApiError("Property ID not found", 400);
    }

    // Validate dates array
    if (!dates || dates.length === 0) {
      throw new ApiError("Invalid date range", 400);
    }

    // Get date range for peak season lookup
    const checkInDate = dates[0];
    const checkOutDate = dates[dates.length - 1];

    if (!checkInDate || !checkOutDate) {
      throw new ApiError("Invalid check-in or check-out date", 400);
    }

    // Get peak seasons for the property and date range
    const peakSeasons = await this.peakSeasonService.findActivePeakSeasonsForProperty(
      propertyId,
      checkInDate,
      checkOutDate
    );

    // Get availability data for the room
    const availabilityData = await this.availabilityService.getBulkAvailabilityForRooms(
      [room.id],
      checkInDate,
      checkOutDate
    );

    for (const date of dates) {
      // Find availability for this specific date
      const availability = availabilityData.find(
        (a: any) => a.roomId === room.id && 
        a.date.toDateString() === date.toDateString()
      );

      if (availability && !availability.isAvailable) {
        throw new ApiError(`Room not available on ${date.toDateString()}`, 400);
      }

      if (availability && availability.bookedUnits + unitCount > room.totalUnits) {
        throw new ApiError(
          `Not enough units available on ${date.toDateString()}`,
          400
        );
      }

      // Find relevant peak seasons for this date
      const relevantPeakSeasons = peakSeasons.filter(ps => 
        date >= ps.startDate && date <= ps.endDate
      );

      // Use Feature 1's advanced pricing calculation
      const { available, price } = calculateFinalRoomPrice(
        room.basePrice,
        availability || null, // Convert undefined to null
        relevantPeakSeasons
      );

      if (!available || !price) {
        throw new ApiError(`Room not available on ${date.toDateString()}`, 400);
      }

      totalAmount += price * unitCount;
    }

    return totalAmount;
  }

  // Legacy method for backward compatibility (simple pricing)
  static async calculateSimpleTotalAmount(room: any, dates: Date[], unitCount: number): Promise<number> {
    let totalAmount = 0;

    for (const date of dates) {
      const availability = room.availability.find(
        (a: any) => a.date.toDateString() === date.toDateString()
      );

      if (availability && !availability.isAvailable) {
        throw new ApiError(`Room not available on ${date.toDateString()}`, 400);
      }

      if (availability && availability.bookedUnits + unitCount > room.totalUnits) {
        throw new ApiError(
          `Not enough units available on ${date.toDateString()}`,
          400
        );
      }

      const dayPrice = availability?.customPrice || room.basePrice;
      totalAmount += dayPrice * unitCount;
    }

    return totalAmount;
  }
}
