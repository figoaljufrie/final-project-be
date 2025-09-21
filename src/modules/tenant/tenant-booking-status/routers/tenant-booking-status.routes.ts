import { Router } from 'express';
import { TenantBookingController } from '../controllers/tenant-booking-status.controller';
import { TenantBookingValidation } from '../validation/tenant-booking-status.validation';
import { AuthMiddleware } from '../../../../shared/middleware/auth-middleware';
import { RBACMiddleware } from '../../../../shared/middleware/rbac-middleware';
import { $Enums } from '../../../../generated/prisma';

export class TenantBookingRoutes {
  private router: Router;
  private tenantBookingController: TenantBookingController;
  private authMiddleware: AuthMiddleware;
  private rbacMiddleware: RBACMiddleware;

  constructor() {
    this.router = Router();
    this.tenantBookingController = new TenantBookingController();
    this.authMiddleware = new AuthMiddleware();
    this.rbacMiddleware = new RBACMiddleware();
    this.initializeRoutes();
  }

  private initializeRoutes() {
    // Get tenant bookings with filters
    this.router.get(
      '/',
      this.authMiddleware.authenticate,
      this.rbacMiddleware.checkRole([$Enums.UserRole.tenant]),
      TenantBookingValidation.getTenantBookings,
      this.tenantBookingController.getTenantBookings
    );

    // Get booking details for tenant
    this.router.get(
      '/:bookingId',
      this.authMiddleware.authenticate,
      this.rbacMiddleware.checkRole([$Enums.UserRole.tenant]),
      TenantBookingValidation.bookingIdParam,
      this.tenantBookingController.getBookingDetails
    );

    // Confirm payment
    this.router.patch(
      '/:bookingId/confirm',
      this.authMiddleware.authenticate,
      this.rbacMiddleware.checkRole([$Enums.UserRole.tenant]),
      TenantBookingValidation.confirmPayment,
      this.tenantBookingController.confirmPayment
    );

    // Reject payment
    this.router.patch(
      '/:bookingId/reject',
      this.authMiddleware.authenticate,
      this.rbacMiddleware.checkRole([$Enums.UserRole.tenant]),
      TenantBookingValidation.rejectPayment,
      this.tenantBookingController.rejectPayment
    );

    // Cancel user order
    this.router.patch(
      '/:bookingId/cancel',
      this.authMiddleware.authenticate,
      this.rbacMiddleware.checkRole([$Enums.UserRole.tenant]),
      TenantBookingValidation.cancelUserOrder,
      this.tenantBookingController.cancelUserOrder
    );

    // Get pending confirmations count
    this.router.get(
      '/pending/count',
      this.authMiddleware.authenticate,
      this.rbacMiddleware.checkRole([$Enums.UserRole.tenant]),
      this.tenantBookingController.getPendingConfirmationsCount
    );

    // Send reminder
    this.router.post(
      '/:bookingId/reminder',
      this.authMiddleware.authenticate,
      this.rbacMiddleware.checkRole([$Enums.UserRole.tenant]),
      TenantBookingValidation.sendReminder,
      this.tenantBookingController.sendReminder
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}