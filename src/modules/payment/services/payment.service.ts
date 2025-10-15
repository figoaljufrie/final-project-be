import * as Midtrans from "midtrans-client";
import { ApiError } from "../../../shared/utils/api-error";
import {
  MidtransPaymentRequest,
  MidtransPaymentResponse,
} from "../dto/payment.dto";

export class PaymentService {
  private snap: any;
  private core: any;

  constructor() {
    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    const clientKey = process.env.MIDTRANS_CLIENT_KEY;

    if (!serverKey || !clientKey) {
      throw new Error("Midtrans credentials not configured");
    }

    this.snap = new Midtrans.Snap({
      isProduction: process.env.MIDTRANS_IS_PRODUCTION === "true",
      serverKey: serverKey,
      clientKey: clientKey,
    });

    this.core = new Midtrans.CoreApi({
      isProduction: process.env.MIDTRANS_IS_PRODUCTION === "true",
      serverKey: serverKey,
      clientKey: clientKey,
    });
  }

  async createPayment(
    bookingData: MidtransPaymentRequest
  ): Promise<MidtransPaymentResponse> {
    try {
      const orderId = `BOOKING-${bookingData.bookingId}-${Date.now()}`;
      
      console.log('Creating Midtrans payment:', {
        bookingId: bookingData.bookingId,
        orderId,
        totalAmount: bookingData.totalAmount,
        userEmail: bookingData.userEmail,
        serverKey: process.env.MIDTRANS_SERVER_KEY?.substring(0, 20) + '...',
        isProduction: process.env.MIDTRANS_IS_PRODUCTION
      });
      
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

      console.log('Midtrans parameter:', JSON.stringify(parameter, null, 2));

      const transaction = await this.snap.createTransaction(parameter);
      
      console.log('Midtrans response:', {
        token: transaction.token ? 'received' : 'missing',
        redirect_url: transaction.redirect_url ? 'received' : 'missing',
        token_preview: transaction.token?.substring(0, 20) + '...'
      });
      
      return {
        token: transaction.token,
        redirectUrl: transaction.redirect_url,
        orderId: orderId,
      };
    } catch (error: any) {
      console.error('Midtrans payment error:', {
        message: error.message,
        stack: error.stack,
        response: error.response?.data
      });
      throw new ApiError("Failed to create Midtrans payment", 500);
    }
  }

  async checkPaymentStatus(orderId: string) {
    try {
      const response = await this.core.transaction.status(orderId);
      return response;
    } catch (error) {
      throw new ApiError("Failed to check payment status", 500);
    }
  }

  verifyWebhook(webhookData: any, signature: string): boolean {
    try {
      const crypto = require("crypto");
      
      // Format Midtrans: SHA512(order_id+status_code+gross_amount+ServerKey)
      const signatureKey = webhookData.order_id + 
                          webhookData.status_code + 
                          webhookData.gross_amount + 
                          process.env.MIDTRANS_SERVER_KEY!;
      
      const expectedSignature = crypto
        .createHash("sha512")
        .update(signatureKey)
        .digest("hex");
      
      console.log('Signature verification:', {
        received: signature,
        expected: expectedSignature,
        match: signature === expectedSignature
      });
      
      return signature === expectedSignature;
    } catch (error) {
      console.error('Webhook signature verification error:', error);
      return false;
    }
  }
}
