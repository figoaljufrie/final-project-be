import { Request, Response } from 'express';
import { CronService } from './cron.service';
import { succHandle } from '../helpers/succ-handler';
import { errHandle } from '../helpers/err-handler';

export class CronController {
  private cronService: CronService;

  constructor() {
    this.cronService = CronService.getInstance();
  }

  // Get scheduled tasks status
  getScheduledTasksStatus = async (req: Request, res: Response) => {
    try {
      const status = this.cronService.getScheduledTasksStatus();
      return succHandle(res, 'Scheduled tasks status retrieved successfully', status);
    } catch (error: any) {
      return errHandle(res, error.message, error.status || 500);
    }
  };

  // Stop all scheduled tasks
  stopAllTasks = async (req: Request, res: Response) => {
    try {
      this.cronService.stopAllTasks();
      return succHandle(res, 'All scheduled tasks stopped successfully', null);
    } catch (error: any) {
      return errHandle(res, error.message, error.status || 500);
    }
  };

  // Manual trigger auto-cancel expired bookings
  triggerAutoCancel = async (req: Request, res: Response) => {
    try {
      await this.cronService.triggerAutoCancelExpiredBookings();
      return succHandle(res, 'Auto-cancel expired bookings triggered successfully', null);
    } catch (error: any) {
      return errHandle(res, error.message, error.status || 500);
    }
  };

  // Schedule booking auto-cancel (for testing)
  scheduleBookingCancel = async (req: Request, res: Response) => {
    try {
      const { bookingId, bookingNo, deadlineDate } = req.body;
      
      if (!bookingId || !bookingNo || !deadlineDate) {
        return errHandle(res, 'bookingId, bookingNo, and deadlineDate are required', 400);
      }

      this.cronService.scheduleBookingAutoCancel(
        parseInt(bookingId), 
        bookingNo, 
        new Date(deadlineDate)
      );
      
      return succHandle(res, 'Booking auto-cancel scheduled successfully', {
        bookingId,
        bookingNo,
        deadlineDate
      });
    } catch (error: any) {
      return errHandle(res, error.message, error.status || 500);
    }
  };

  // Cancel booking tasks
  cancelBookingTasks = async (req: Request, res: Response) => {
    try {
      const { bookingId } = req.params;
      
      if (!bookingId) {
        return errHandle(res, 'bookingId is required', 400);
      }

      this.cronService.cancelBookingTasks(parseInt(bookingId));
      
      return succHandle(res, 'Booking tasks cancelled successfully', { bookingId });
    } catch (error: any) {
      return errHandle(res, error.message, error.status || 500);
    }
  };
}