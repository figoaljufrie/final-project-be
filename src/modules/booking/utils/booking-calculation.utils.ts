import { ApiError } from "../../../shared/utils/api-error";

export class BookingCalculationUtils {
  // Calculation methods (moved from shared utils)
  static async calculateTotalAmount(room: any, dates: Date[], unitCount: number): Promise<number> {
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
