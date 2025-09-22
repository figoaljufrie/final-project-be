import * as cron from "node-cron";
import { BookingStatus } from "../../../generated/prisma";
import { BookingUtils } from "../../../shared/utils/booking-utils";
import { BookingEmailUtils } from "../../booking/utils/booking-email.utils";
import { mailProofService, BookingEmailData } from "../../../shared/utils/mail/mail-proof";
import { CronRepository } from "../repository/cron.repository";
import { CronUtils } from "../utils/cron.utils";

export class CronService {
  private static instance: CronService;
  private scheduledTasks: Map<string, cron.ScheduledTask> = new Map();
  private cronRepository: CronRepository;

  private constructor() {
    this.cronRepository = new CronRepository();
  }

  public static getInstance(): CronService {
    if (!CronService.instance) {
      CronService.instance = new CronService();
    }
    return CronService.instance;
  }

  // Schedule auto-cancel for specific booking
  public scheduleBookingAutoCancel(
    bookingId: number,
    bookingNo: string,
    deadlineDate: Date
  ): void {
    const taskKey = CronUtils.generateTaskId('auto-cancel', bookingId);
    this.cancelScheduledTask(taskKey);

    const cronExpression = CronUtils.getCronExpression(deadlineDate);

    if (CronUtils.isDateInPast(deadlineDate)) {
      console.error(`Failed to schedule auto-cancel for booking ${bookingNo}: Date is in the past`);
      return;
    }

    console.log(`Scheduling auto-cancel for booking ${bookingNo} at ${CronUtils.formatDate(deadlineDate)}`);

    try {
      const task = cron.schedule(
        cronExpression,
        async () => {
          try {
            console.log(`Running auto-cancel for booking: ${bookingNo}`);
            await this.cancelExpiredBooking(bookingId);
            this.cancelScheduledTask(taskKey);
          } catch (error) {
            console.error(`Error auto-canceling booking ${bookingNo}:`, error);
          }
        },
        { timezone: "Asia/Jakarta" }
      );

      this.scheduledTasks.set(taskKey, task);
    } catch (error) {
      console.error(`Failed to schedule auto-cancel for booking ${bookingNo}:`, error);
    }
  }

  // Schedule check-in reminder for specific booking
  public scheduleCheckInReminder(
    bookingId: number,
    bookingNo: string,
    checkInDate: Date
  ): void {
    const taskKey = CronUtils.generateTaskId('check-in-reminder', bookingId);
    this.cancelScheduledTask(taskKey);

    const reminderDate = CronUtils.getCheckInReminderDate(checkInDate);

    if (CronUtils.isDateInPast(reminderDate)) {
      console.log(`Check-in reminder for booking ${bookingNo} is in the past, skipping`);
      return;
    }

    const cronExpression = CronUtils.getCronExpression(reminderDate);

    console.log(`Scheduling check-in reminder for booking ${bookingNo} at ${CronUtils.formatDate(reminderDate)}`);

    try {
      const task = cron.schedule(
        cronExpression,
        async () => {
          try {
            console.log(`Sending check-in reminder for booking: ${bookingNo}`);
            await this.sendCheckInReminder(bookingId);
            this.cancelScheduledTask(taskKey);
          } catch (error) {
            console.error(`Error sending check-in reminder for booking ${bookingNo}:`, error);
          }
        },
        { timezone: "Asia/Jakarta" }
      );

      this.scheduledTasks.set(taskKey, task);
    } catch (error) {
      console.error(`Failed to schedule check-in reminder for booking ${bookingNo}:`, error);
    }
  }

  // Cancel specific booking tasks
  public cancelBookingTasks(bookingId: number): void {
    const autoCancelKey = CronUtils.generateTaskId('auto-cancel', bookingId);
    const checkinReminderKey = CronUtils.generateTaskId('check-in-reminder', bookingId);

    this.cancelScheduledTask(autoCancelKey);
    this.cancelScheduledTask(checkinReminderKey);

    console.log(`Cancelled all tasks for booking ID: ${bookingId}`);
  }

  // Trigger auto-cancel for all expired bookings (manual trigger)
  public async triggerAutoCancelExpiredBookings(): Promise<void> {
    console.log("Triggering auto-cancel for all expired bookings...");

    const expiredBookings = await this.cronRepository.getExpiredBookings();
    console.log(`Found ${expiredBookings.length} expired bookings`);

    for (const booking of expiredBookings) {
      try {
        await this.cancelExpiredBooking(booking.id);
        console.log(`Successfully cancelled expired booking: ${booking.bookingNo}`);
      } catch (error) {
        console.error(`Failed to cancel booking ${booking.bookingNo}:`, error);
      }
    }
  }

  // Get all scheduled tasks status
  public getScheduledTasksStatus(): any {
    const tasks: any[] = [];

    this.scheduledTasks.forEach((task, key) => {
      tasks.push({
        taskId: key,
        running: task.getStatus() === 'scheduled',
        nextExecution: 'N/A', // node-cron doesn't provide this info
      });
    });

    return {
      totalTasks: this.scheduledTasks.size,
      tasks,
    };
  }

  // Stop all cron jobs
  public stopAllTasks(): void {
    console.log(`Stopping ${this.scheduledTasks.size} scheduled tasks...`);

    this.scheduledTasks.forEach((task, key) => {
      try {
        task.stop();
        console.log(`Stopped task: ${key}`);
      } catch (error) {
        console.error(`Error stopping task ${key}:`, error);
      }
    });

    this.scheduledTasks.clear();
    console.log("All tasks stopped");
  }

  // Private helper methods
  private cancelScheduledTask(taskKey: string): void {
    const task = this.scheduledTasks.get(taskKey);
    if (task) {
      try {
        task.stop();
        this.scheduledTasks.delete(taskKey);
        console.log(`Cancelled scheduled task: ${taskKey}`);
      } catch (error) {
        console.error(`Error cancelling task ${taskKey}:`, error);
      }
    }
  }

  // Private methods for actual operations
  private async cancelExpiredBooking(bookingId: number): Promise<void> {
    const booking = await this.cronRepository.getBookingForAutoCancel(bookingId);

    if (!booking) {
      console.error(`Booking ${bookingId} not found`);
      return;
    }

    if (booking.status !== BookingStatus.waiting_for_payment) {
      console.log(`Booking ${booking.bookingNo} is no longer waiting for payment, skipping cancellation`);
      return;
    }

    // Cancel booking with transaction
    const dates = BookingUtils.getDateRange(booking.checkIn, booking.checkOut);
    const roomId = booking.items[0]?.roomId;
    const unitCount = booking.items[0]?.unitCount;

    if (!roomId || !unitCount) {
      console.error(`Invalid booking data for booking ${booking.bookingNo}`);
      return;
    }

    await this.cronRepository.autoCancelBooking(bookingId, dates, roomId, unitCount);

    // Send cancellation email
    try {
      const emailData: BookingEmailData = BookingEmailUtils.formatBookingEmailData(booking, {
        cancellationReason: "Payment deadline expired - Auto cancelled",
        bookingUrl: `${process.env.FRONTEND_URL}/bookings/${booking.id}`,
      });
      await mailProofService.sendBookingCancelledEmail(emailData);
      console.log(`Sent auto-cancellation email for booking: ${booking.bookingNo}`);
    } catch (error) {
      console.error(`Failed to send auto-cancellation email for booking ${booking.bookingNo}:`, error);
    }

    console.log(`Successfully auto-cancelled booking: ${booking.bookingNo}`);
  }

  private async sendCheckInReminder(bookingId: number): Promise<void> {
    const booking = await this.cronRepository.getBookingForCheckInReminder(bookingId);

    if (!booking) {
      console.error(`Booking ${bookingId} not found`);
      return;
    }

    if (booking.status !== BookingStatus.confirmed) {
      console.log(`Booking ${booking.bookingNo} is not confirmed, skipping check-in reminder`);
      return;
    }

    // Send check-in reminder email
    try {
      const emailData: BookingEmailData = BookingEmailUtils.formatBookingEmailData(booking, {
        propertyAddress: booking.items[0]?.room?.property?.address || '',
        contactPerson: 'Property Owner',
        contactNumber: '',
        bookingUrl: `${process.env.FRONTEND_URL}/bookings/${booking.id}`,
      });
      await mailProofService.sendCheckInReminderEmail(emailData);
      console.log(`Sent check-in reminder email for booking: ${booking.bookingNo}`);
    } catch (error) {
      console.error(`Failed to send check-in reminder email for booking ${booking.bookingNo}:`, error);
    }
  }
}
