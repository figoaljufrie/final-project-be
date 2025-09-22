import midtransClient, { Snap, CoreApi } from 'midtrans-node';
import { ApiError } from '../../../shared/utils/api-error';
import { MidtransPaymentRequest, MidtransPaymentResponse } from '../dto/payment.dto';

export class PaymentService {
  private snap: Snap;
  private core: CoreApi;

  constructor() {
    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    const clientKey = process.env.MIDTRANS_CLIENT_KEY;
    
    if (!serverKey || !clientKey) {
      throw new Error('Midtrans credentials not configured');
    }

    this.snap = new midtransClient.Snap({
      isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
      serverKey: serverKey,
      clientKey: clientKey,
    });

    this.core = new midtransClient.CoreApi({
      isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
      serverKey: serverKey,
    });
  }

  async createPayment(bookingData: MidtransPaymentRequest): Promise<MidtransPaymentResponse> {
    try {
      const parameter = {
        transaction_details: {
          order_id: `BOOKING-${bookingData.bookingId}-${Date.now()}`,
          gross_amount: bookingData.totalAmount,
        },
        customer_details: {
          email: bookingData.userEmail,
          first_name: bookingData.userName,
        },
        item_details: [
          {
            id: `booking-${bookingData.bookingId}`,
            price: bookingData.totalAmount,
            quantity: 1,
            name: `Booking ${bookingData.bookingNo}`,
          },
        ],
        callbacks: {
          finish: `${process.env.FRONTEND_URL}/bookings/${bookingData.bookingId}/payment-success`,
          pending: `${process.env.FRONTEND_URL}/bookings/${bookingData.bookingId}/payment-pending`,
          error: `${process.env.FRONTEND_URL}/bookings/${bookingData.bookingId}/payment-error`,
        },
      };

      const transaction = await this.snap.createTransaction(parameter);
      return {
        token: transaction.token,
        redirectUrl: transaction.redirect_url,
        orderId: parameter.transaction_details.order_id,
      };
    } catch (error) {
      throw new ApiError('Failed to create Midtrans payment', 500);
    }
  }

  async checkPaymentStatus(orderId: string) {
    try {
      const response = await this.core.transaction.status(orderId);
      return response;
    } catch (error) {
      throw new ApiError('Failed to check payment status', 500);
    }
  }

  verifyWebhook(webhookData: any, signature: string): boolean {
    try {
      const crypto = require('crypto');
      const expectedSignature = crypto
        .createHmac('sha512', process.env.MIDTRANS_WEBHOOK_SECRET!)
        .update(JSON.stringify(webhookData))
        .digest('hex');
      
      return signature === expectedSignature;
    } catch (error) {
      return false;
    }
  }
}