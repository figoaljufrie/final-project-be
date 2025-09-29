import { ApiError } from "./api-error";

export class BookingUtils {
  // Generate unique booking number
  static generateBookingNumber(): string {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `BK${timestamp.slice(-6)}${random}`;
  }

  // Get payment deadline based on payment method
  static getPaymentDeadline(paymentMethod: 'manual_transfer' | 'payment_gateway'): Date {
    const deadline = new Date();
    
    if (paymentMethod === 'manual_transfer') {
      // Manual transfer: 1 hour deadline
      deadline.setHours(deadline.getHours() + 1);
    } else if (paymentMethod === 'payment_gateway') {
      // Payment gateway: 24 hours deadline (Midtrans standard)
      deadline.setHours(deadline.getHours() + 24);
    }
    
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
}
