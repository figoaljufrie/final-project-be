import { TenantBookingRepository } from '../repository/tenant-booking-status.repository';
import { TenantBookingFilter, ConfirmPaymentRequest, RejectPaymentRequest, CancelUserOrderRequest, SendReminderRequest } from '../dto/tenant-booking-status.dto';
import { BookingStatus } from '../../../../generated/prisma';
import { ApiError } from '../../../../shared/utils/api-error';
import { CronService } from '../../../cron/services/cron.service';
import { mailProofService, BookingEmailData } from '../../../../shared/utils/mail/mail-proof';

export class TenantBookingService {
  private tenantBookingRepository: TenantBookingRepository;
  private cronService: CronService;

  constructor() {
    this.tenantBookingRepository = new TenantBookingRepository();
    this.cronService = CronService.getInstance();
  }

  // Get tenant bookings with filters
  async getTenantBookings(filters: TenantBookingFilter) {
    const { bookings, total } = await this.tenantBookingRepository.getTenantBookings(filters);
    
    const totalPages = Math.ceil(total / (filters.limit || 10));
    
    return {
      bookings,
      pagination: {
        total,
        page: filters.page || 1,
        limit: filters.limit || 10,
        totalPages,
      },
    };
  }

  // Get booking details for tenant
  async getBookingDetails(bookingId: number, tenantId: number) {
    const booking = await this.tenantBookingRepository.findTenantBooking(bookingId, tenantId);
    
    if (!booking) {
      throw new ApiError('Booking not found or not accessible', 404);
    }
    
    return booking;
  }

  // Confirm payment
  async confirmPayment(data: ConfirmPaymentRequest) {
    const { bookingId, tenantId } = data;
    
    // Verify booking belongs to tenant
    const booking = await this.tenantBookingRepository.findTenantBooking(bookingId, tenantId);
    if (!booking) {
      throw new ApiError('Booking not found or not accessible', 404);
    }
    
    if (booking.status !== BookingStatus.waiting_for_confirmation) {
      throw new ApiError('Only bookings waiting for confirmation can be confirmed', 400);
    }
    
    // Confirm payment
    const confirmedBooking = await this.tenantBookingRepository.confirmPayment(bookingId);
    
    // Cancel auto-cancel task and schedule check-in reminder and booking completion
    this.cronService.cancelBookingTasks(bookingId);
    this.cronService.scheduleCheckInReminder(bookingId, booking.bookingNo, booking.checkIn);
    this.cronService.scheduleBookingCompletion(bookingId, booking.bookingNo, booking.checkOut);
    
    // Send payment confirmed email to user and notification to tenant
    try {
      const emailData: BookingEmailData = {
        userName: booking.user?.name || 'User',
        userEmail: booking.user?.email || '',
        bookingNo: booking.bookingNo,
        propertyName: booking.items[0]?.room?.property?.name || 'Property',
        checkIn: booking.checkIn.toISOString().split('T')[0] || '',
        checkOut: booking.checkOut.toISOString().split('T')[0] || '',
        totalAmount: booking.totalAmount.toLocaleString('id-ID'),
        paymentMethod: 'manual_transfer',
        confirmationNotes: 'Payment has been confirmed by property owner',
        bookingUrl: `${process.env.FRONTEND_URL}/bookings/${booking.id}`,
        bookingDetailUrl: `${process.env.FRONTEND_URL}/bookings/${booking.id}`,
        // Tenant data
        tenantName: booking.items[0]?.room?.property?.tenant?.name || 'Property Owner',
        tenantEmail: booking.items[0]?.room?.property?.tenant?.email || '',
        tenantDashboardUrl: `${process.env.FRONTEND_URL}/tenant/dashboard`,
      };
      
      // Send confirmation email to user
      await mailProofService.sendUserPaymentConfirmationEmail(emailData);
      
      // Send notification email to tenant
      await mailProofService.sendTenantNewPaymentNotificationEmail(emailData);
      
      console.log(`Sent payment confirmation emails for manual transfer booking: ${booking.bookingNo}`);
    } catch (error) {
      console.error('Failed to send payment confirmed emails:', error);
    }
    
    return confirmedBooking;
  }

  // Reject payment
  async rejectPayment(data: RejectPaymentRequest) {
    const { bookingId, tenantId, rejectionReason } = data;
    
    // Verify booking belongs to tenant
    const booking = await this.tenantBookingRepository.findTenantBooking(bookingId, tenantId);
    if (!booking) {
      throw new ApiError('Booking not found or not accessible', 404);
    }
    
    if (booking.status !== BookingStatus.waiting_for_confirmation) {
      throw new ApiError('Only bookings waiting for confirmation can be rejected', 400);
    }
    
    // Reject payment
    const rejectedBooking = await this.tenantBookingRepository.rejectPayment(bookingId, rejectionReason);
    
    // Send payment rejected email to user
    try {
      const emailData: BookingEmailData = {
        userName: booking.user?.name || 'User',
        userEmail: booking.user?.email || '',
        bookingNo: booking.bookingNo,
        propertyName: booking.items[0]?.room?.property?.name || 'Property',
        checkIn: booking.checkIn.toISOString().split('T')[0] || '',
        checkOut: booking.checkOut.toISOString().split('T')[0] || '',
        totalAmount: booking.totalAmount.toLocaleString('id-ID'),
        rejectionReason: rejectionReason,
        bookingUrl: `${process.env.FRONTEND_URL}/bookings/${booking.id}`,
      };
      await mailProofService.sendPaymentRejectedEmail(emailData);
    } catch (error) {
      console.error('Failed to send payment rejected email:', error);
    }
    
    return rejectedBooking;
  }

  // Cancel user order
  async cancelUserOrder(data: CancelUserOrderRequest) {
    const { bookingId, tenantId, cancelReason } = data;
    
    // Verify booking belongs to tenant
    const booking = await this.tenantBookingRepository.findTenantBooking(bookingId, tenantId);
    if (!booking) {
      throw new ApiError('Booking not found or not accessible', 404);
    }
    
    if (booking.status === BookingStatus.cancelled) {
      throw new ApiError('Booking is already cancelled', 400);
    }
    
    // Cancel booking
    const cancelledBooking = await this.tenantBookingRepository.cancelUserOrder(bookingId, cancelReason);
    
    // Cancel any scheduled tasks
    this.cronService.cancelBookingTasks(bookingId);
    
    // Send payment rejected email to user
    try {
      const emailData: BookingEmailData = {
        userName: booking.user?.name || 'User',
        userEmail: booking.user?.email || '',
        bookingNo: booking.bookingNo,
        propertyName: booking.items[0]?.room?.property?.name || 'Property',
        checkIn: booking.checkIn.toISOString().split('T')[0] || '',
        checkOut: booking.checkOut.toISOString().split('T')[0] || '',
        totalAmount: booking.totalAmount.toLocaleString('id-ID'),
        rejectionReason: cancelReason,
        bookingUrl: `${process.env.FRONTEND_URL}/bookings/${booking.id}`,
      };
      await mailProofService.sendPaymentRejectedEmail(emailData);
    } catch (error) {
      console.error('Failed to send payment rejected email:', error);
    }
    
    return cancelledBooking;
  }

  // Get pending confirmations count
  async getPendingConfirmationsCount(tenantId: number) {
    return await this.tenantBookingRepository.getPendingConfirmationsCount(tenantId);
  }

  // Send reminder
  async sendReminder(data: SendReminderRequest) {
    const { bookingId, tenantId, reminderType } = data;
    
    // Verify booking belongs to tenant
    const booking = await this.tenantBookingRepository.findTenantBooking(bookingId, tenantId);
    if (!booking) {
      throw new ApiError('Booking not found or not accessible', 404);
    }
    
    // Send reminder email based on type
    try {
      const emailData: BookingEmailData = {
        userName: booking.user?.name || 'User',
        userEmail: booking.user?.email || '',
        bookingNo: booking.bookingNo,
        propertyName: booking.items[0]?.room?.property?.name || 'Property',
        checkIn: booking.checkIn.toISOString().split('T')[0] || '',
        checkOut: booking.checkOut.toISOString().split('T')[0] || '',
        totalAmount: booking.totalAmount.toLocaleString('id-ID'),
        propertyAddress: booking.items[0]?.room?.property?.address || '',
        contactPerson: 'Property Owner', // Using fallback since tenant data not available
        contactNumber: '', // Using fallback since tenant data not available
        bookingUrl: `${process.env.FRONTEND_URL}/bookings/${booking.id}`,
      };

      if (reminderType === 'checkin') {
        await mailProofService.sendCheckInReminderEmail(emailData);
      } else if (reminderType === 'payment') {
        // Check if payment deadline has passed
        const now = new Date();
        const deadline = booking.paymentDeadline;
        
        if (!deadline || now > deadline) {
          console.log(`Payment deadline has passed for booking ${booking.bookingNo}, skipping reminder email`);
          return { message: 'Payment deadline has passed, reminder not sent' };
        }
        
        // Calculate time remaining
        const timeRemaining = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60));
        
        emailData.paymentDeadline = deadline.toISOString().split('T')[0];
        emailData.timeRemaining = `${timeRemaining} hours`;
        emailData.paymentMethod = booking.paymentMethod || 'manual_transfer';
        
        // Send different reminder based on payment method
        if (booking.paymentMethod === 'manual_transfer') {
          emailData.uploadPaymentProofUrl = `${process.env.FRONTEND_URL}/bookings/${booking.id}/upload-payment`;
          await mailProofService.sendManualTransferReminderEmail(emailData);
        } else if (booking.paymentMethod === 'payment_gateway') {
          emailData.midtransRedirectUrl = booking.midtransToken ? 
            `https://app.sandbox.midtrans.com/snap/v4/redirection/${booking.midtransToken}` : 
            `${process.env.FRONTEND_URL}/bookings/${booking.id}/payment`;
          await mailProofService.sendPaymentGatewayReminderEmail(emailData);
        } else {
          // Fallback to generic reminder
          await mailProofService.sendAutoCancelReminderEmail(emailData);
        }
      }
    } catch (error) {
      console.error('Failed to send reminder email:', error);
    }
    
    return {
      message: `${reminderType} reminder sent successfully`,
      bookingId,
      reminderType,
    };
  }
}