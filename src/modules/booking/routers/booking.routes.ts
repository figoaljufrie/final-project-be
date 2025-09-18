import { Router } from 'express';
import { BookingController } from '../controllers/booking.controller';
import { BookingValidation } from '../validation/booking.validation';

export class BookingRoutes {
  private router: Router;
  private bookingController: BookingController;

  constructor() {
    this.router = Router();
    this.bookingController = new BookingController();
    this.initializeRoutes();
  }

  private initializeRoutes() {
    // POST /api/bookings - Create new booking
    this.router.post(
      '/',
      BookingValidation.createBooking,
      this.bookingController.createBooking
    );

    // GET /api/bookings - Get user bookings with filters
    this.router.get(
      '/',
      BookingValidation.getBookingsQuery,
      this.bookingController.getUserBookings
    );

    // GET /api/bookings/:bookingId - Get booking details
    this.router.get(
      '/:bookingId',
      BookingValidation.getBookingDetails,
      this.bookingController.getBookingDetails
    );

    // PUT /api/bookings/:bookingId/cancel - Cancel booking
    this.router.put(
      '/:bookingId/cancel',
      BookingValidation.cancelBooking,
      this.bookingController.cancelBooking
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}