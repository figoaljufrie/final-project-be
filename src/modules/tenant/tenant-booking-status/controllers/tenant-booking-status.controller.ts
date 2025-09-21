import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { TenantBookingService } from '../services/tenant-booking-status.services';
import { succHandle } from '../../../../shared/helpers/succ-handler';
import { errHandle } from '../../../../shared/helpers/err-handler';

export class TenantBookingController {
  private tenantBookingService: TenantBookingService;

  constructor() {
    this.tenantBookingService = new TenantBookingService();
  }

  // Get tenant bookings with filters
  getTenantBookings = async (req: Request, res: Response) => {
    try {
      const validationErrors = validationResult(req);
      if (!validationErrors.isEmpty()) {
        return errHandle(res, 'Validation failed', 400, validationErrors.array());
      }

      const tenantId = (req as any).user.id;
      const filters = {
        tenantId,
        ...req.query,
      };

      const result = await this.tenantBookingService.getTenantBookings(filters);
      return succHandle(res, 'Tenant bookings retrieved successfully', result);
    } catch (error: any) {
      return errHandle(res, error.message || 'Failed to retrieve tenant bookings', 500);
    }
  };

  // Get booking details for tenant
  getBookingDetails = async (req: Request, res: Response) => {
    try {
      const validationErrors = validationResult(req);
      if (!validationErrors.isEmpty()) {
        return errHandle(res, 'Validation failed', 400, validationErrors.array());
      }

      const bookingId = Number(req.params.bookingId);
      const tenantId = (req as any).user.id;

      const booking = await this.tenantBookingService.getBookingDetails(bookingId, tenantId);
      return succHandle(res, 'Booking details retrieved successfully', booking);
    } catch (error: any) {
      return errHandle(res, error.message || 'Failed to retrieve booking details', 500);
    }
  };

  // Confirm payment
  confirmPayment = async (req: Request, res: Response) => {
    try {
      const validationErrors = validationResult(req);
      if (!validationErrors.isEmpty()) {
        return errHandle(res, 'Validation failed', 400, validationErrors.array());
      }

      const bookingId = Number(req.params.bookingId);
      const tenantId = (req as any).user.id;
      const { confirmationNotes } = req.body;

      const confirmData = {
        bookingId,
        tenantId,
        confirmationNotes,
      };

      const result = await this.tenantBookingService.confirmPayment(confirmData);
      return succHandle(res, 'Payment confirmed successfully', result);
    } catch (error: any) {
      return errHandle(res, error.message || 'Failed to confirm payment', 500);
    }
  };

  // Reject payment
  rejectPayment = async (req: Request, res: Response) => {
    try {
      const validationErrors = validationResult(req);
      if (!validationErrors.isEmpty()) {
        return errHandle(res, 'Validation failed', 400, validationErrors.array());
      }

      const bookingId = Number(req.params.bookingId);
      const tenantId = (req as any).user.id;
      const { rejectionReason } = req.body;

      const rejectData = {
        bookingId,
        tenantId,
        rejectionReason,
      };

      const result = await this.tenantBookingService.rejectPayment(rejectData);
      return succHandle(res, 'Payment rejected successfully', result);
    } catch (error: any) {
      return errHandle(res, error.message || 'Failed to reject payment', 500);
    }
  };

  // Cancel user order
  cancelUserOrder = async (req: Request, res: Response) => {
    try {
      const validationErrors = validationResult(req);
      if (!validationErrors.isEmpty()) {
        return errHandle(res, 'Validation failed', 400, validationErrors.array());
      }

      const bookingId = Number(req.params.bookingId);
      const tenantId = (req as any).user.id;
      const { cancelReason } = req.body;

      const cancelData = {
        bookingId,
        tenantId,
        cancelReason,
      };

      const result = await this.tenantBookingService.cancelUserOrder(cancelData);
      return succHandle(res, 'User order cancelled successfully', result);
    } catch (error: any) {
      return errHandle(res, error.message || 'Failed to cancel user order', 500);
    }
  };

  // Get pending confirmations count
  getPendingConfirmationsCount = async (req: Request, res: Response) => {
    try {
      const tenantId = (req as any).user.id;
      const count = await this.tenantBookingService.getPendingConfirmationsCount(tenantId);
      return succHandle(res, 'Pending confirmations count retrieved successfully', { count });
    } catch (error: any) {
      return errHandle(res, error.message || 'Failed to retrieve pending confirmations count', 500);
    }
  };

  // Send reminder
  sendReminder = async (req: Request, res: Response) => {
    try {
      const validationErrors = validationResult(req);
      if (!validationErrors.isEmpty()) {
        return errHandle(res, 'Validation failed', 400, validationErrors.array());
      }

      const bookingId = Number(req.params.bookingId);
      const tenantId = (req as any).user.id;
      const { reminderType } = req.body;

      const reminderData = {
        bookingId,
        tenantId,
        reminderType,
      };

      const result = await this.tenantBookingService.sendReminder(reminderData);
      return succHandle(res, 'Reminder sent successfully', result);
    } catch (error: any) {
      return errHandle(res, error.message || 'Failed to send reminder', 500);
    }
  };
}