import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { PaymentService } from '../services/payment.service';
import { WebhookService } from '../services/webhook.service';
import { errHandle } from '../../../shared/helpers/err-handler';
import { succHandle } from '../../../shared/helpers/succ-handler';

export class PaymentController {
  private paymentService: PaymentService;
  private webhookService: WebhookService;

  constructor() {
    this.paymentService = new PaymentService();
    this.webhookService = new WebhookService();
  }

  createPayment = async (req: Request, res: Response) => {
    try {
      const validationErrors = validationResult(req);
      if (!validationErrors.isEmpty()) {
        return errHandle(res, 'Validation failed', 400, validationErrors.array());
      }

      const { bookingId, bookingNo, totalAmount, userEmail, userName } = req.body;

      const paymentData = await this.paymentService.createPayment({
        bookingId,
        bookingNo,
        totalAmount,
        userEmail,
        userName,
      });

      return succHandle(res, 'Payment created successfully', paymentData);
    } catch (error: any) {
      return errHandle(res, error.message || 'Failed to create payment', 500);
    }
  };

  checkPaymentStatus = async (req: Request, res: Response) => {
    try {
      const { orderId } = req.params;
      if (!orderId) {
        return errHandle(res, 'Order ID is required', 400);
      }
      const status = await this.paymentService.checkPaymentStatus(orderId);
      return succHandle(res, 'Payment status retrieved', status);
    } catch (error: any) {
      return errHandle(res, error.message || 'Failed to check payment status', 500);
    }
  };

  handleWebhook = async (req: Request, res: Response) => {
    try {
      const signature = req.headers['x-midtrans-signature'] as string;
      const webhookData = req.body;

      console.log('Received webhook:', {
        order_id: webhookData.order_id,
        transaction_status: webhookData.transaction_status,
        status_code: webhookData.status_code,
        gross_amount: webhookData.gross_amount,
        signature: signature ? 'present' : 'missing'
      });

      // Skip signature verification if no signature provided (for testing)
      if (signature && !this.paymentService.verifyWebhook(webhookData, signature)) {
        console.error('Invalid webhook signature');
        // Don't fail in development mode
        if (process.env.MIDTRANS_IS_PRODUCTION === 'true') {
          return errHandle(res, 'Invalid webhook signature', 401);
        } else {
          console.warn('⚠️ Development mode: Processing webhook without valid signature');
        }
      }

      // Process webhook data
      await this.webhookService.processWebhook(webhookData);
      
      return succHandle(res, 'Webhook processed successfully', {
        order_id: webhookData.order_id,
        transaction_status: webhookData.transaction_status,
      });
    } catch (error: any) {
      console.error('Webhook processing error:', error);
      return errHandle(res, error.message || 'Failed to process webhook', 500);
    }
  };

  // Testing endpoint - no signature verification required
  handleWebhookTest = async (req: Request, res: Response) => {
    try {
      const webhookData = req.body;

      // Process webhook data without signature verification
      await this.webhookService.processWebhook(webhookData);
      
      return succHandle(res, 'Webhook processed successfully', {
        order_id: webhookData.order_id,
        transaction_status: webhookData.transaction_status,
        bookingStatus: webhookData.transaction_status === 'capture' ? 'confirmed' : 
                      webhookData.transaction_status === 'deny' || webhookData.transaction_status === 'expire' ? 'cancelled' : 'waiting_for_payment'
      });
    } catch (error: any) {
      console.error('Webhook processing error:', error);
      return errHandle(res, error.message || 'Failed to process webhook', 500);
    }
  };
}
