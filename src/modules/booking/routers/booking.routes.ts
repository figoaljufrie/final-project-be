import { Router } from 'express';
import { BookingController } from '../controllers/booking.controller';
import { BookingValidation } from '../validation/booking.validation';
import { AuthMiddleware } from '../../../shared/middleware/auth-middleware';
import { RBACMiddleware } from '../../../shared/middleware/rbac-middleware';
import { $Enums } from '../../../generated/prisma';

export class BookingRoutes {
  private router: Router;
  private bookingController: BookingController;
  private authMiddleware: AuthMiddleware;
  private rbacMiddleware: RBACMiddleware;

  constructor() {
    this.router = Router();
    this.bookingController = new BookingController();
    this.authMiddleware = new AuthMiddleware();
    this.rbacMiddleware = new RBACMiddleware();
    this.initializeRoutes();
  }

  private initializeRoutes() {
    // POST /api/bookings - Create new booking with auth and rbac
    this.router.post(
      '/',
      BookingValidation.createBooking,
      this.authMiddleware.authenticate,
      this.rbacMiddleware.checkRole([$Enums.UserRole.user]),
      this.bookingController.createBooking
    );

    // GET /api/bookings - Get user bookings (it is for user to get their own bookings)
    this.router.get(
      '/',
      BookingValidation.getBookingsQuery,
      this.authMiddleware.authenticate,
      this.rbacMiddleware.checkRole([$Enums.UserRole.user]),
      this.bookingController.getUserBookings
    );

    // GET /api/bookings/:bookingId - Get booking details (it is for user to get their own booking details)
    this.router.get(
      '/:bookingId',
      BookingValidation.getBookingDetails,
      this.authMiddleware.authenticate,
      this.rbacMiddleware.checkRole([$Enums.UserRole.user]), 
      this.bookingController.getBookingDetails
    );

    // PUT /api/bookings/:bookingId/cancel - Cancel booking with auth and rbac
    this.router.put(
      '/:bookingId/cancel',
      BookingValidation.cancelBooking,
      this.authMiddleware.authenticate,
      this.rbacMiddleware.checkRole([$Enums.UserRole.user]),
      this.bookingController.cancelBooking
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}