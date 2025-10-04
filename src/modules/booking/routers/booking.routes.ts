import { Router } from "express";
import { BookingController } from "../controllers/booking.controller";
import { BookingValidation } from "../validation/booking.validation";
import { AuthMiddleware } from "../../../shared/middleware/auth-middleware";
import { RBACMiddleware } from "../../../shared/middleware/rbac-middleware";
import { $Enums } from "../../../generated/prisma";
import { UploaderMiddleware } from "../../../shared/middleware/uploader-middleware";

export class BookingRoutes {
  private router: Router;
  private bookingController: BookingController;
  private authMiddleware: AuthMiddleware;
  private rbacMiddleware: RBACMiddleware;
  private uploaderMiddleware: UploaderMiddleware;

  constructor() {
    this.router = Router();
    this.bookingController = new BookingController();
    this.authMiddleware = new AuthMiddleware();
    this.rbacMiddleware = new RBACMiddleware();
    this.uploaderMiddleware = new UploaderMiddleware();
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post(
      "/",
      BookingValidation.createBooking,
      this.authMiddleware.authenticate,
      this.rbacMiddleware.checkRole([$Enums.UserRole.user]),
      this.bookingController.createBooking
    );

    this.router.get(
      "/",
      BookingValidation.getBookingsQuery,
      this.authMiddleware.authenticate,
      this.rbacMiddleware.checkRole([$Enums.UserRole.user]),
      this.bookingController.getUserBookings
    );

    this.router.get(
      "/:bookingId",
      BookingValidation.getBookingDetails,
      this.authMiddleware.authenticate,
      this.rbacMiddleware.checkRole([$Enums.UserRole.user]),
      this.bookingController.getBookingDetails
    );

    this.router.put(
      "/:bookingId/cancel",
      BookingValidation.cancelBooking,
      this.authMiddleware.authenticate,
      this.rbacMiddleware.checkRole([$Enums.UserRole.user]),
      this.bookingController.cancelBooking
    );

    this.router.post(
      "/:bookingId/upload-payment",
      this.authMiddleware.authenticate,
      this.rbacMiddleware.checkRole([$Enums.UserRole.user]),
      this.uploaderMiddleware.upload().single("file"),
      BookingValidation.uploadPaymentProof,
      this.bookingController.uploadPaymentProof
    );

    this.router.post(
      '/:bookingId/midtrans-payment',
      this.authMiddleware.authenticate,
      this.rbacMiddleware.checkRole([$Enums.UserRole.user]),
      this.bookingController.createMidtransPayment
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}