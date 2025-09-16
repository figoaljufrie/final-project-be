import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { BookingService } from './booking.service';
import { succHandle } from '../../shared/helpers/succ-handler';
import { errHandle } from '../../shared/helpers/err-handler';

export class BookingController {
  private bookingService: BookingService;

  constructor() {
    this.bookingService = new BookingService();
  }

  // Create new booking
  createBooking = async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errHandle(res, 'Validation error', 400, errors.array());
      }

      const bookingData = req.body;
      const booking = await this.bookingService.createBooking(bookingData);
      
      return succHandle(res, 'Booking created successfully', booking, 201);
    } catch (error: any) {
      return errHandle(res, error.message, error.status || 500);
    }
  };

  // Get user bookings
  getUserBookings = async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errHandle(res, 'Validation error', 400, errors.array());
      }

      const filters = req.query;
      const bookings = await this.bookingService.getUserBookings(filters as any);
      
      return succHandle(res, 'Bookings retrieved successfully', bookings);
    } catch (error: any) {
      return errHandle(res, error.message, error.status || 500);
    }
  };

  // Get booking details
  getBookingDetails = async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errHandle(res, 'Validation error', 400, errors.array());
      }

      const { bookingId } = req.params;
      const { userId } = req.query;

      const booking = await this.bookingService.getBookingDetails(
        Number(bookingId), 
        Number(userId)
      );
      
      return succHandle(res, 'Booking details retrieved successfully', booking);
    } catch (error: any) {
      return errHandle(res, error.message, error.status || 500);
    }
  };

  // Cancel booking
  cancelBooking = async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errHandle(res, 'Validation error', 400, errors.array());
      }

      const { bookingId } = req.params;
      const { userId, cancelReason } = req.body;

      const cancelData = {
        bookingId: Number(bookingId),
        userId: Number(userId),
        cancelReason
      };

      const booking = await this.bookingService.cancelBooking(cancelData);
      
      return succHandle(res, 'Booking cancelled successfully', booking);
    } catch (error: any) {
      return errHandle(res, error.message, error.status || 500);
    }
  };
}