import { BookingStatus } from "../../../generated/prisma";
import { ApiError } from "../../../shared/utils/api-error";
import { BookingRepository } from "../repository/booking.repository";
import { BookingUtils } from "../../../shared/utils/bookings/booking.utils";
import {
  CreateBookingRequest,
  BookingFilter,
  BookingListResponse,
  BookingWithDetails,
  CancelBookingRequest,
} from "../dto/booking.dto";

export class BookingService {
  private bookingRepository: BookingRepository;

  constructor() {
    this.bookingRepository = new BookingRepository();
  }

  // Create new booking
  async createBooking(data: CreateBookingRequest) {
    const { userId, roomId, checkIn, checkOut, totalGuests, unitCount, notes } = data;

    // Validate dates
    const { checkInDate, checkOutDate, nights } = this.validateBookingDates(
      checkIn,
      checkOut
    );

    // Check room availability
    const room = await this.bookingRepository.findRoomWithAvailability(
      roomId,
      checkInDate,
      checkOutDate
    );

    if (!room) {
      throw new ApiError("Room not available", 400);
    }

    // Validate capacity and units
    this.validateBookingCapacity(room, totalGuests, unitCount);

    // Calculate pricing
    const dates = BookingUtils.getDateRange(checkInDate, checkOutDate);
    const totalAmount = await this.calculateTotalAmount(room, dates, unitCount);

    // Prepare booking data
    const bookingData = {
      bookingNo: BookingUtils.generateBookingNumber(),
      userId,
      status: BookingStatus.waiting_for_payment,
      totalAmount,
      paymentDeadline: BookingUtils.getPaymentDeadline(),
      checkIn: checkInDate,
      checkOut: checkOutDate,
      totalGuests,
      notes,
      items: {
        create: {
          roomId,
          unitCount,
          unitPrice: Math.floor(totalAmount / nights / unitCount),
          nights,
          subTotal: totalAmount,
        },
      },
    };

    // Create booking with transaction (ATOMIC)
    const booking = await this.bookingRepository.createBookingWithTransaction(
      bookingData,
      dates,
      roomId,
      unitCount
    );

    return booking;
  }

  // Get user bookings with pagination
  async getUserBookings(filters: BookingFilter): Promise<BookingListResponse> {
    const { bookings, total } =
      await this.bookingRepository.getUserBookings(filters);

    return {
      bookings: bookings as BookingWithDetails[],
      pagination: {
        total,
        page: Number(filters.page || 1),
        limit: Number(filters.limit || 10),
        totalPages: Math.ceil(total / Number(filters.limit || 10)),
      },
    };
  }

  // Get booking details
  async getBookingDetails(bookingId: number, userId: number) {
    const booking = await this.bookingRepository.findUserBooking(
      bookingId,
      userId
    );

    if (!booking) {
      throw new ApiError("Booking not found", 404);
    }

    return booking;
  }

  // Cancel booking
  async cancelBooking(data: CancelBookingRequest) {
    const { bookingId, userId, cancelReason } = data;

    const booking = await this.bookingRepository.findUserBooking(
      bookingId,
      userId
    );

    if (!booking) {
      throw new ApiError("Booking not found", 404);
    }

    if (booking.status !== BookingStatus.waiting_for_payment) {
      throw new ApiError("Cannot cancel booking at this stage", 400);
    }

    // Cancel booking with transaction (ATOMIC)
    const dates = BookingUtils.getDateRange(booking.checkIn, booking.checkOut);
    const cancelledBooking =
      await this.bookingRepository.cancelBookingWithTransaction(
        bookingId,
        cancelReason,
        booking.items,
        dates
      );

    return cancelledBooking;
  }

  // Private business logic methods

  private validateBookingDates(checkIn: string, checkOut: string) {
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

  private validateBookingCapacity(
    room: any,
    totalGuests: number,
    unitCount: number
  ) {
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

  private async calculateTotalAmount(
    room: any,
    dates: Date[],
    unitCount: number
  ): Promise<number> {
    let totalAmount = 0;

    for (const date of dates) {
      const availability = room.availability.find(
        (a: any) => a.date.toDateString() === date.toDateString()
      );

      if (availability && !availability.isAvailable) {
        throw new ApiError(`Room not available on ${date.toDateString()}`, 400);
      }

      if (
        availability &&
        availability.bookedUnits + unitCount > room.totalUnits
      ) {
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
