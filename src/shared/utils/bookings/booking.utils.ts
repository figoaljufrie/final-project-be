import { ApiError } from "../api-error";

export class BookingUtils {
  // Generate unique booking number
  static generateBookingNumber(): string {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `BK${timestamp.slice(-6)}${random}`;
  }

  // Get payment deadline (1 hour from now)
  static getPaymentDeadline(): Date {
    const deadline = new Date();
    deadline.setHours(deadline.getHours() + 1);
    return deadline;
  }

  // Get date range between two dates
  static getDateRange(startDate: Date, endDate: Date): Date[] {
    const dates: Date[] = [];
    const currentDate = new Date(startDate);
    
    while (currentDate < endDate) {
      dates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return dates;
  }

  // Calculate nights between dates
  static calculateNights(checkIn: Date, checkOut: Date): number {
    const timeDiff = checkOut.getTime() - checkIn.getTime();
    return Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
  }

  // Validation methods (moved from service)
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

    const nights = this.calculateNights(checkInDate, checkOutDate);

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

  // NEW: Calculation methods (moved from service)
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

  // NEW: Email data formatting methods
  static formatBookingEmailData(booking: any, additionalData: any = {}): any {
    return {
      userName: booking.user?.name || 'User',
      userEmail: booking.user?.email || '',
      bookingNo: booking.bookingNo,
      propertyName: booking.items[0]?.room?.property?.name || 'Property',
      checkIn: booking.checkIn.toISOString().split('T')[0] || '',
      checkOut: booking.checkOut.toISOString().split('T')[0] || '',
      totalAmount: booking.totalAmount.toLocaleString('id-ID'),
      ...additionalData,
    };
  }
}