import { Router } from 'express';
import { PaymentController } from '../controllers/payment.controller';
import { PaymentValidation } from '../validation/payment.validation';
import { AuthMiddleware } from '../../../shared/middleware/auth-middleware';
import { RBACMiddleware } from '../../../shared/middleware/rbac-middleware';
import { $Enums } from '../../../generated/prisma';

export class PaymentRoutes {
  public router: Router;
  private paymentController: PaymentController;
  private authMiddleware: AuthMiddleware;
  private rbacMiddleware: RBACMiddleware;

  constructor() {
    this.router = Router();
    this.paymentController = new PaymentController();
    this.authMiddleware = new AuthMiddleware();
    this.rbacMiddleware = new RBACMiddleware();
    this.initializeRoutes();
  }

  private initializeRoutes() {
    // Create payment
    this.router.post(
      '/create-payment',
      this.authMiddleware.authenticate,
      this.rbacMiddleware.checkRole([$Enums.UserRole.user]),
      PaymentValidation.createPayment,
      this.paymentController.createPayment
    );

    // Check payment status
    this.router.get(
      '/payment-status/:orderId',
      this.authMiddleware.authenticate,
      this.rbacMiddleware.checkRole([$Enums.UserRole.user]),
      PaymentValidation.checkPaymentStatus,
      this.paymentController.checkPaymentStatus
    );

    // Webhook endpoint (no auth needed)
    this.router.post(
      '/webhook',
      this.paymentController.handleWebhook
    );

    // Testing webhook endpoint (no signature verification)
    this.router.post(
      '/webhook-test',
      this.paymentController.handleWebhookTest
    );
  }
}
