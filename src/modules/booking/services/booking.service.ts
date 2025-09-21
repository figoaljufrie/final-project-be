import { BookingStatus } from "../../../generated/prisma";
import { ApiError } from "../../../shared/utils/api-error";
import { BookingRepository } from "../repository/booking.repository";
import { BookingUtils } from "../../../shared/utils/bookings/booking.utils";
import { CloudinaryUtils } from "../../../shared/utils/cloudinary/cloudinary";
import { CronService } from "../../../shared/cron/cron.service";
import { mailProofService, BookingEmailData } from "../../../shared/utils/mail/mail-proof";

import {
  CreateBookingRequest,
  BookingFilter,
  BookingListResponse,
  BookingWithDetails,
  CancelBookingRequest,
  UploadPaymentProofRequest,
} from "../dto/booking.dto";

export class BookingService {
  private bookingRepository: BookingRepository;
  private cloudinaryUtils: CloudinaryUtils;
  private cronService: CronService;

  constructor() {
    this.bookingRepository = new BookingRepository();
    this.cloudinaryUtils = new CloudinaryUtils();
    this.cronService = CronService.getInstance();
  }

  // Create new booking
  async createBooking(data: CreateBookingRequest) {
    const { userId, roomId, checkIn, checkOut, totalGuests, unitCount, notes } = data;

    // Validate dates using BookingUtils
    const { checkInDate, checkOutDate, nights } = BookingUtils.validateBookingDates(checkIn, checkOut);

    // Check room availability
    const room = await this.bookingRepository.findRoomWithAvailability(roomId, checkInDate, checkOutDate);
    if (!room) {
      throw new ApiError("Room not available", 400);
    }

    // Validate capacity using BookingUtils
    BookingUtils.validateBookingCapacity(room, totalGuests, unitCount);

    // Calculate pricing using BookingUtils
    const dates = BookingUtils.getDateRange(checkInDate, checkOutDate);
    const totalAmount = await BookingUtils.calculateTotalAmount(room, dates, unitCount);

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

    this.cronService.scheduleBookingAutoCancel(booking.id, booking.bookingNo, booking.paymentDeadline!);
    return booking;
  }

  // Get user bookings with pagination
  async getUserBookings(filters: BookingFilter): Promise<BookingListResponse> {
    const { bookings, total } = await this.bookingRepository.getUserBookings(filters);
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
    const booking = await this.bookingRepository.findUserBooking(bookingId, userId);
    if (!booking) {
      throw new ApiError("Booking not found", 404);
    }
    return booking;
  }

  // Cancel booking
  async cancelBooking(data: CancelBookingRequest) {
    const { bookingId, userId, cancelReason } = data;
    const booking = await this.bookingRepository.findBookingById(bookingId);

    if (!booking || booking.userId !== userId) {
      throw new ApiError("Booking not found", 404);
    }

    if (booking.status !== BookingStatus.waiting_for_payment) {
      throw new ApiError("Cannot cancel booking at this stage", 400);
    }

    // Cancel booking with transaction (ATOMIC)
    const dates = BookingUtils.getDateRange(booking.checkIn, booking.checkOut);
    const cancelledBooking = await this.bookingRepository.cancelBookingWithTransaction(
        bookingId,
        cancelReason,
        booking.items,
        dates
      );

    // Cancel booking tasks and send email
    this.cronService.cancelBookingTasks(data.bookingId);
    await this.sendCancellationEmail(booking, cancelReason);

    return cancelledBooking;
  }

  // Upload payment proof
  async uploadPaymentProof(data: UploadPaymentProofRequest, file: Express.Multer.File) {
    const { bookingId, userId, paymentMethod } = data;
    const booking = await this.bookingRepository.findBookingById(bookingId);

    if (!booking || booking.userId !== userId) {
      throw new ApiError('Booking not found', 404);
    }

    if (booking.status !== BookingStatus.waiting_for_payment) {
      throw new ApiError('Payment proof can only be uploaded for bookings waiting for payment', 400);
    }

    if (booking.paymentDeadline && new Date() > booking.paymentDeadline) {
      throw new ApiError('Payment deadline has passed', 400);
    }

    // Upload to Cloudinary and update booking
    const uploadResult = await this.cloudinaryUtils.upload(file);
    const updatedBooking = await this.bookingRepository.updatePaymentProof(
      bookingId,
      uploadResult.secure_url,
      paymentMethod
    );

    // Cancel booking tasks and send email
    this.cronService.cancelBookingTasks(bookingId);
    await this.sendPaymentProofUploadedEmail(booking, paymentMethod);

    return {
      id: updatedBooking.id,
      bookingNo: updatedBooking.bookingNo,
      status: updatedBooking.status,
      paymentMethod: updatedBooking.paymentMethod,
      paymentProofUrl: updatedBooking.paymentProofUrl,
      updatedAt: updatedBooking.updatedAt,
    };
  }

  // Private email methods
  private async sendCancellationEmail(booking: any, cancelReason: string) {
    try {
      const emailData = BookingUtils.formatBookingEmailData(booking, {
        cancellationReason: cancelReason,
        bookingUrl: `${process.env.FRONTEND_URL}/bookings/${booking.id}`,
      });
      await mailProofService.sendBookingCancelledEmail(emailData);
    } catch (error) {
      console.error('Failed to send cancellation email:', error);
    }
  }

  private async sendPaymentProofUploadedEmail(booking: any, paymentMethod: string) {
    try {
      const emailData = BookingUtils.formatBookingEmailData(booking, {
        paymentMethod,
        tenantName: booking.items[0]?.room?.property?.tenant?.name || 'Property Owner',
        tenantEmail: booking.items[0]?.room?.property?.tenant?.email || '',
        dashboardUrl: `${process.env.FRONTEND_URL}/tenant/dashboard`,
      });
      await mailProofService.sendPaymentProofUploadedEmail(emailData);
    } catch (error) {
      console.error('Failed to send payment proof email:', error);
    }
  }
}