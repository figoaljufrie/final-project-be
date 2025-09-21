import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { BookingService } from '../services/booking.service';
import { succHandle } from '../../../shared/helpers/succ-handler';
import { errHandle } from '../../../shared/helpers/err-handler';

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

      const userId = (req as any).user.id;
      const bookingData = {
        ...req.body,
        userId, // add from jwt
      }
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

      const userId = (req as any).user.id;
      const filters = {
        userId,
        status: req.query.status as any,
        bookingNo: req.query.bookingNo as string,
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
        page: Number(req.query.page || 1),
        limit: Number(req.query.limit || 10),
      }
      const bookings = await this.bookingService.getUserBookings(filters);
      
      return succHandle(res, 'User bookings retrieved successfully', bookings);
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

      const bookingId = Number(req.params.bookingId);
      const userId = (req as any).user.id;

      const booking = await this.bookingService.getBookingDetails(
        bookingId, 
        userId
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

      const bookingId = Number(req.params.bookingId);
      const userId = (req as any).user.id;
      const { cancelReason } = req.body;

      const cancelData = {
        bookingId,
        userId,
        cancelReason,
      }

      const booking = await this.bookingService.cancelBooking(cancelData);
      
      return succHandle(res, 'Booking cancelled successfully', booking);
    } catch (error: any) {
      return errHandle(res, error.message, error.status || 500);
    }
  };

  // Upload payment proof
  uploadPaymentProof = async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errHandle(res, 'Validation error', 400, errors.array());
      }

      if (!req.file) {
        return errHandle(res, 'Payment proof image is required', 400);
      }

      const bookingId = Number(req.params.bookingId);
      const userId = (req as any).user.id;
      const { paymentMethod } = req.body;

      const uploadData = {
        bookingId,
        userId,
        paymentMethod,
      };

      const result = await this.bookingService.uploadPaymentProof(
        uploadData, 
        req.file
      );
      
      return succHandle(res, 'Payment proof uploaded successfully', result);
    } catch (error: any) {
      return errHandle(res, error.message, error.status || 500);
    }
  };
}