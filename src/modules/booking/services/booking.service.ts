import { BookingStatus, PaymentMethod } from "../../../generated/prisma";
import { ApiError } from "../../../shared/utils/api-error";
import { BookingRepository } from "../repository/booking.repository";
import { BookingUtils } from "../../../shared/utils/booking-utils";
import { BookingValidationUtils } from "../utils/booking-validation.utils";
import { BookingCalculationUtils } from "../utils/booking-calculation.utils";
import { BookingEmailUtils } from "../utils/booking-email.utils";
import { CloudinaryUtils } from "../../../shared/utils/cloudinary/cloudinary";
import { CronService } from "../../cron/services/cron.service";
import {
  mailProofService,
  BookingEmailData,
} from "../../../shared/utils/mail/mail-proof";

import {
  CreateBookingRequest,
  BookingFilter,
  BookingListResponse,
  BookingWithDetails,
  CancelBookingRequest,
  UploadPaymentProofRequest,
} from "../dto/booking.dto";
import { PaymentService } from "../../payment/services/payment.service";

export class BookingService {
  private bookingRepository: BookingRepository;
  private cloudinaryUtils: CloudinaryUtils;
  private cronService: CronService;
  private paymentService: PaymentService;

  constructor() {
    this.bookingRepository = new BookingRepository();
    this.cloudinaryUtils = new CloudinaryUtils();
    this.cronService = CronService.getInstance();
    this.paymentService = new PaymentService();
  }

  // Create new booking
  async createBooking(data: CreateBookingRequest) {
    const {
      userId,
      roomId,
      checkIn,
      checkOut,
      totalGuests,
      unitCount,
      notes,
      paymentMethod,
    } = data;

    // Validate dates using BookingValidationUtils
    const { checkInDate, checkOutDate, nights } =
      BookingValidationUtils.validateBookingDates(checkIn, checkOut);

    // Check room availability
    const room = await this.bookingRepository.findRoomWithAvailability(
      roomId,
      checkInDate,
      checkOutDate
    );
    if (!room) {
      throw new ApiError("Room not available", 400);
    }

    // Validate capacity using BookingValidationUtils
    BookingValidationUtils.validateBookingCapacity(
      room,
      totalGuests,
      unitCount
    );

    // Calculate pricing using BookingCalculationUtils
    const dates = BookingUtils.getDateRange(checkInDate, checkOutDate);
    const totalAmount = await BookingCalculationUtils.calculateTotalAmount(
      room,
      dates,
      unitCount
    );

    // Prepare booking data
    const bookingData = {
      bookingNo: BookingUtils.generateBookingNumber(),
      userId,
      status: BookingStatus.waiting_for_payment,
      totalAmount,
      paymentMethod, // Store selected payment method
      paymentDeadline: BookingUtils.getPaymentDeadline(paymentMethod),
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

    // Handle payment method specific logic
    if (paymentMethod === PaymentMethod.payment_gateway) {
      // For Midtrans payment, create payment immediately and return with payment data
      const paymentData = await this.createMidtransPayment(booking.id, userId);

      // Get updated booking with Midtrans data
      const updatedBooking = await this.bookingRepository.findBookingById(booking.id);

      return {
        ...updatedBooking,
        midtransPayment: paymentData, // Include Midtrans payment data
      };
    } else {
      // For manual transfer, schedule auto-cancel
      this.cronService.scheduleBookingAutoCancel(
        booking.id,
        booking.bookingNo,
        booking.paymentDeadline!
      );
    }
    
    // Note: Payment gateway bookings don't need auto-cancel scheduling
    // because Midtrans handles expiration automatically via webhooks

    return booking;
  }

  // Get user bookings with pagination
  async getUserBookings(filters: BookingFilter): Promise<BookingListResponse> {
    const { bookings, total } = await this.bookingRepository.getUserBookings(
      filters
    );
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
    const booking = await this.bookingRepository.findBookingById(bookingId);

    if (!booking || booking.userId !== userId) {
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

    // Cancel booking tasks and send email
    this.cronService.cancelBookingTasks(data.bookingId);
    await this.sendCancellationEmail(booking, cancelReason);

    return cancelledBooking;
  }

  // Upload payment proof
  async uploadPaymentProof(
    data: UploadPaymentProofRequest,
    file: Express.Multer.File
  ) {
    const { bookingId, userId, paymentMethod } = data;
    const booking = await this.bookingRepository.findBookingById(bookingId);

    if (!booking || booking.userId !== userId) {
      throw new ApiError("Booking not found", 404);
    }

    if (booking.status !== BookingStatus.waiting_for_payment) {
      throw new ApiError(
        "Payment proof can only be uploaded for bookings waiting for payment",
        400
      );
    }

    if (booking.paymentDeadline && new Date() > booking.paymentDeadline) {
      throw new ApiError("Payment deadline has passed", 400);
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

  // Add Midtrans payment method
  async createMidtransPayment(bookingId: number, userId: number) {
    const booking = await this.bookingRepository.findBookingById(bookingId);

    if (!booking || booking.userId !== userId) {
      throw new ApiError("Booking not found", 404);
    }

    if (booking.status !== BookingStatus.waiting_for_payment) {
      throw new ApiError("Booking is not in waiting for payment status", 400);
    }

    const paymentData = await this.paymentService.createPayment({
      bookingId: booking.id,
      bookingNo: booking.bookingNo,
      totalAmount: booking.totalAmount,
      userEmail: booking.user?.email || "",
      userName: booking.user?.name || "User",
    });

    // Update booking with Midtrans data
    await this.bookingRepository.updateBooking(bookingId, {
      paymentMethod: PaymentMethod.payment_gateway,
      midtransOrderId: paymentData.orderId,
      midtransToken: paymentData.token,
      midtransStatus: "pending",
    });

    return paymentData;
  }

  // Private email methods
  private async sendCancellationEmail(booking: any, cancelReason: string) {
    try {
      const emailData = BookingEmailUtils.formatBookingEmailData(booking, {
        cancellationReason: cancelReason,
        bookingUrl: `${process.env.FRONTEND_URL}/bookings/${booking.id}`,
      });
      await mailProofService.sendBookingCancelledEmail(emailData);
    } catch (error) {
      console.error("Failed to send cancellation email:", error);
    }
  }

  private async sendPaymentProofUploadedEmail(
    booking: any,
    paymentMethod: string
  ) {
    try {
      const emailData = BookingEmailUtils.formatBookingEmailData(booking, {
        paymentMethod,
        tenantName:
          booking.items[0]?.room?.property?.tenant?.name || "Property Owner",
        tenantEmail: booking.items[0]?.room?.property?.tenant?.email || "",
        dashboardUrl: `${process.env.FRONTEND_URL}/tenant/dashboard`,
      });
      await mailProofService.sendPaymentProofUploadedEmail(emailData);
    } catch (error) {
      console.error("Failed to send payment proof email:", error);
    }
  }
}