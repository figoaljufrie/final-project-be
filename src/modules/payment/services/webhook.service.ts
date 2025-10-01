import { prisma } from '../../../shared/utils/prisma';
import { BookingStatus, PaymentMethod } from '../../../generated/prisma';
import { ApiError } from '../../../shared/utils/api-error';
import { mailProofService, BookingEmailData } from '../../../shared/utils/mail/mail-proof';
import { CronService } from '../../cron/services/cron.service';
import { MidtransWebhookData } from '../dto/payment.dto';
import { BookingUtils } from '../../../shared/utils/booking-utils';

export class WebhookService {
  private cronService: CronService;

  constructor() {
    this.cronService = CronService.getInstance();
  }

  async processWebhook(webhookData: MidtransWebhookData): Promise<void> {
    try {
      // Log webhook untuk audit trail
      await this.logWebhook(webhookData);

      // Extract booking ID dari order_id
      const bookingId = this.extractBookingId(webhookData.order_id);
      if (!bookingId) {
        throw new Error(`Invalid order_id format: ${webhookData.order_id}`);
      }

      // Get booking data
      const booking = await this.getBookingWithDetails(bookingId);
      if (!booking) {
        throw new Error(`Booking not found: ${bookingId}`);
      }

      // Process payment berdasarkan status
      await this.processPaymentStatus(booking, webhookData);

    } catch (error) {
      console.error('Webhook processing error:', error);
      throw error;
    }
  }

  private async logWebhook(webhookData: MidtransWebhookData): Promise<void> {
    await prisma.webhookLog.create({
      data: {
        orderId: webhookData.order_id,
        eventType: webhookData.transaction_status,
        status: webhookData.status_code === '200' ? 'success' : 'failed',
        rawData: webhookData as any,
        processed: false,
      },
    });
  }

  private extractBookingId(orderId: string): number | null {
    // Format: BOOKING-{bookingId}-{timestamp}
    const match = orderId.match(/^BOOKING-(\d+)-\d+$/);
    return match && match[1] ? parseInt(match[1]) : null;
  }

  private async getBookingWithDetails(bookingId: number) {
    return await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        items: {
          include: {
            room: {
              include: {
                property: {
                  include: {
                    tenant: {
                      select: {
                        id: true,
                        name: true,
                        email: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  private async processPaymentStatus(booking: any, webhookData: MidtransWebhookData): Promise<void> {
    const { transaction_status, payment_type, settlement_time } = webhookData;

    switch (transaction_status) {
      case 'capture':
      case 'settlement':
        await this.handleSuccessfulPayment(booking, webhookData);
        break;
      
      case 'pending':
        await this.handlePendingPayment(booking, webhookData);
        break;
      
      case 'deny':
      case 'cancel':
      case 'expire':
      case 'failure':
        await this.handleFailedPayment(booking, webhookData);
        break;
      
      default:
        console.warn(`Unknown transaction status: ${transaction_status}`);
    }

    // Update webhook log sebagai processed
    await prisma.webhookLog.updateMany({
      where: {
        orderId: webhookData.order_id,
        processed: false,
      },
      data: {
        processed: true,
      },
    });
  }

  private async handleSuccessfulPayment(booking: any, webhookData: MidtransWebhookData): Promise<void> {
    // Update booking status ke confirmed
    await prisma.booking.update({
      where: { id: booking.id },
      data: {
        status: BookingStatus.confirmed,
        confirmedAt: new Date(),
        midtransStatus: webhookData.transaction_status,
        midtransPaymentType: webhookData.payment_type,
        midtransSettlementTime: webhookData.settlement_time ? new Date(webhookData.settlement_time) : null,
      },
    });

    // Cancel auto-cancel task dan schedule check-in reminder and booking completion
    this.cronService.cancelBookingTasks(booking.id);
    this.cronService.scheduleCheckInReminder(booking.id, booking.bookingNo, booking.checkIn);
    this.cronService.scheduleBookingCompletion(booking.id, booking.bookingNo, booking.checkOut);

    // Send payment confirmed email
    await this.sendPaymentConfirmedEmail(booking, webhookData);
  }

  private async handlePendingPayment(booking: any, webhookData: MidtransWebhookData): Promise<void> {
    // Update Midtrans status tapi tetap waiting_for_payment
    await prisma.booking.update({
      where: { id: booking.id },
      data: {
        midtransStatus: webhookData.transaction_status,
        midtransPaymentType: webhookData.payment_type,
      },
    });

    console.log(`Payment pending for booking ${booking.bookingNo}`);
  }

  private async handleFailedPayment(booking: any, webhookData: MidtransWebhookData): Promise<void> {
    // Update booking status to cancelled for failed payments
    await prisma.booking.update({
      where: { id: booking.id },
      data: {
        status: BookingStatus.cancelled,
        cancelledAt: new Date(),
        cancelReason: `Payment ${webhookData.transaction_status} - ${webhookData.status_message}`,
        midtransStatus: webhookData.transaction_status,
        midtransPaymentType: webhookData.payment_type,
      },
    });

    // Cancel any scheduled tasks and release room availability
    this.cronService.cancelBookingTasks(booking.id);
    await this.releaseRoomAvailability(booking);

    // Send payment failed email
    await this.sendPaymentFailedEmail(booking, webhookData);
  }

  private async sendPaymentConfirmedEmail(booking: any, webhookData: MidtransWebhookData): Promise<void> {
    try {
      const emailData: BookingEmailData = {
        userName: booking.user?.name || 'User',
        userEmail: booking.user?.email || '',
        bookingNo: booking.bookingNo,
        propertyName: booking.items[0]?.room?.property?.name || 'Property',
        checkIn: booking.checkIn.toISOString().split('T')[0] || '',
        checkOut: booking.checkOut.toISOString().split('T')[0] || '',
        totalAmount: booking.totalAmount.toLocaleString('id-ID'),
        paymentMethod: 'payment_gateway',
        confirmationNotes: `Payment confirmed via ${webhookData.payment_type}`,
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
      
      console.log(`Sent payment confirmation emails for booking: ${booking.bookingNo}`);
    } catch (error) {
      console.error('Failed to send payment confirmed emails:', error);
    }
  }

  private async sendPaymentFailedEmail(booking: any, webhookData: MidtransWebhookData): Promise<void> {
    try {
      const emailData: BookingEmailData = {
        userName: booking.user?.name || 'User',
        userEmail: booking.user?.email || '',
        bookingNo: booking.bookingNo,
        propertyName: booking.items[0]?.room?.property?.name || 'Property',
        checkIn: booking.checkIn.toISOString().split('T')[0] || '',
        checkOut: booking.checkOut.toISOString().split('T')[0] || '',
        totalAmount: booking.totalAmount.toLocaleString('id-ID'),
        rejectionReason: `Payment ${webhookData.transaction_status} via ${webhookData.payment_type}`,
        bookingUrl: `${process.env.FRONTEND_URL}/bookings/${booking.id}`,
      };
      
      await mailProofService.sendPaymentRejectedEmail(emailData);
    } catch (error) {
      console.error('Failed to send payment failed email:', error);
    }
  }

  private async releaseRoomAvailability(booking: any): Promise<void> {
    try {
      const dates = BookingUtils.getDateRange(booking.checkIn, booking.checkOut);
      
      for (const date of dates) {
        await prisma.roomAvailability.updateMany({
          where: {
            roomId: booking.items[0].roomId,
            date: date,
          },
          data: {
            bookedUnits: {
              decrement: booking.items[0].unitCount,
            },
          },
        });
      }
      
      console.log(`Released room availability for booking ${booking.bookingNo}`);
    } catch (error) {
      console.error('Failed to release room availability:', error);
    }
  }
}