import { ApiError } from "../../../shared/utils/api-error";
import { BookingUtils } from "../../../shared/utils/booking-utils";

export class BookingValidationUtils {
  // Validation methods (moved from shared utils)
  static validateBookingDates(checkIn: string, checkOut: string) {
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (checkInDate < today) {
      throw new ApiError("Check-in date cannot be in the past", 400);
    }

    if (checkOutDate <= checkInDate) {
      throw new ApiError("Check-out date must be after check-in date", 400);
    }

    const nights = BookingUtils.calculateNights(checkInDate, checkOutDate);

    if (nights > 30) {
      throw new ApiError("Maximum booking duration is 30 nights", 400);
    }

    return { checkInDate, checkOutDate, nights };
  }

  static validateBookingCapacity(room: any, totalGuests: number, unitCount: number) {
    if (totalGuests > room.capacity * unitCount) {
      throw new ApiError(
        `Room capacity exceeded. Maximum guests: ${room.capacity * unitCount}`,
        400
      );
    }

    if (unitCount > room.totalUnits) {
      throw new ApiError(
        `Not enough units available. Available units: ${room.totalUnits}`,
        400
      );
    }
  }
}
