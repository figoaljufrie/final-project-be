import * as Midtrans from 'midtrans-client';
import { ApiError } from '../../../shared/utils/api-error';
import { MidtransPaymentRequest, MidtransPaymentResponse } from '../dto/payment.dto';

export class PaymentService {
  private snap: any;
  private core: any;

  constructor() {
    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    const clientKey = process.env.MIDTRANS_CLIENT_KEY;
    
    if (!serverKey || !clientKey) {
      throw new Error('Midtrans credentials not configured');
    }

    this.snap = new Midtrans.Snap({
      isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
      serverKey: serverKey,
      clientKey: clientKey,
    });

    this.core = new Midtrans.CoreApi({
      isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
      serverKey: serverKey,
      clientKey: clientKey,
    });
  }

  async createPayment(bookingData: MidtransPaymentRequest): Promise<MidtransPaymentResponse> {
    try {
      const orderId = `BOOKING-${bookingData.bookingId}-${Date.now()}`;
      
      const parameter = {
        transaction_details: {
          order_id: orderId,
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
          finish: `${process.env.FRONTEND_URL}?from=success&order_id=${orderId}`,
          pending: `${process.env.FRONTEND_URL}?from=pending&order_id=${orderId}`,
          error: `${process.env.FRONTEND_URL}?from=error&order_id=${orderId}`,
        },
      };

      const transaction = await this.snap.createTransaction(parameter);
      return {
        token: transaction.token,
        redirectUrl: transaction.redirect_url,
        orderId: orderId,
      };
    } catch (error) {
      console.error('Midtrans payment error:', error);
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