export class BookingEmailUtils {
  // Email data formatting methods (moved from shared utils)
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
