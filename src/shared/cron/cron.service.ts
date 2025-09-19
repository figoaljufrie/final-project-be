import * as cron from "node-cron";
import { prisma } from "../utils/prisma";
import { BookingStatus } from "../../generated/prisma";
import { BookingUtils } from "../utils/bookings/booking.utils";

export class CronService {
  private static instance: CronService;
  private scheduledTasks: Map<string, cron.ScheduledTask> = new Map();

  private constructor() {}

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
    const taskKey = `auto-cancel-${bookingId}`;

    // Cancel existing task if any
    this.cancelScheduledTask(taskKey);

    // Calculate when to run (at deadline time)
    const cronExpression = this.dateToCronExpression(deadlineDate);

    // Validate cron expression
    if (!this.validateCronExpression(cronExpression)) {
      console.error(`Failed to schedule auto-cancel for booking ${bookingNo}: Invalid cron expression`);
      return;
    }

    console.log(
      `Scheduling auto-cancel for booking ${bookingNo} at ${deadlineDate.toISOString()}`
    );

    try {
      const task = cron.schedule(
        cronExpression,
        async () => {
          try {
            console.log(`Running auto-cancel for booking: ${bookingNo}`);
            await this.cancelExpiredBooking(bookingId);

            // Remove task after execution
            this.cancelScheduledTask(taskKey);
          } catch (error) {
            console.error(`Error auto-canceling booking ${bookingNo}:`, error);
          }
        },
        {
          timezone: "Asia/Jakarta",
        }
      );

      this.scheduledTasks.set(taskKey, task);
      console.log(`Successfully scheduled auto-cancel task for booking ${bookingNo}`);
    } catch (error) {
      console.error(`Failed to create cron task for booking ${bookingNo}:`, error);
    }
  }

  // Schedule check-in reminder for specific booking
  public scheduleCheckInReminder(
    bookingId: number,
    bookingNo: string,
    checkInDate: Date
  ): void {
    const taskKey = `checkin-reminder-${bookingId}`;

    // Calculate H-1 (1 day before check-in at 10:00 AM)
    const reminderDate = new Date(checkInDate);
    reminderDate.setDate(reminderDate.getDate() - 1);
    reminderDate.setHours(10, 0, 0, 0); // 10:00 AM

    // Don't schedule if reminder time is in the past
    if (reminderDate <= new Date()) {
      console.log(
        `Check-in reminder for booking ${bookingNo} not scheduled (time has passed)`
      );
      return;
    }

    // Cancel existing task if any
    this.cancelScheduledTask(taskKey);

    const cronExpression = this.dateToCronExpression(reminderDate);

    // Validate cron expression
    if (!this.validateCronExpression(cronExpression)) {
      console.error(`Failed to schedule check-in reminder for booking ${bookingNo}: Invalid cron expression`);
      return;
    }

    console.log(
      `Scheduling check-in reminder for booking ${bookingNo} at ${reminderDate.toISOString()}`
    );

    try {
      const task = cron.schedule(
        cronExpression,
        async () => {
          try {
            console.log(`Sending check-in reminder for booking: ${bookingNo}`);
            await this.sendCheckInReminder(bookingId);

            // Remove task after execution
            this.cancelScheduledTask(taskKey);
      } catch (error) {
            console.error(
              `Error sending check-in reminder for booking ${bookingNo}:`,
              error
            );
          }
        },
        {
          timezone: "Asia/Jakarta",
        }
      );

      this.scheduledTasks.set(taskKey, task);
      console.log(`Successfully scheduled check-in reminder for booking ${bookingNo}`);
    } catch (error) {
      console.error(`Failed to create check-in reminder task for booking ${bookingNo}:`, error);
    }
  }

  // Cancel scheduled task for specific booking
  public cancelBookingTasks(bookingId: number): void {
    const autoCancelKey = `auto-cancel-${bookingId}`;
    const reminderKey = `checkin-reminder-${bookingId}`;

    this.cancelScheduledTask(autoCancelKey);
    this.cancelScheduledTask(reminderKey);
  }

  // Manual trigger for testing
  public async triggerAutoCancelExpiredBookings(): Promise<void> {
    const now = new Date();
    
    const expiredBookings = await prisma.booking.findMany({
      where: {
        status: BookingStatus.waiting_for_payment,
        paymentDeadline: {
          lt: now,
        },
      },
      include: {
        items: {
          include: {
            room: true,
          },
        },
      },
    });

    console.log(`Found ${expiredBookings.length} expired bookings to cancel`);

    for (const booking of expiredBookings) {
      try {
        await this.cancelExpiredBooking(booking.id);
        console.log(
          `Successfully cancelled expired booking: ${booking.bookingNo}`
        );
      } catch (error) {
        console.error(`Failed to cancel booking ${booking.bookingNo}:`, error);
      }
    }
  }

  // Get all scheduled tasks status
  public getScheduledTasksStatus(): any {
    const tasks = Array.from(this.scheduledTasks.entries()).map(
      ([key, task]) => ({
        taskKey: key,
        isRunning: task.getStatus() === "scheduled",
      })
    );

    return {
      totalTasks: this.scheduledTasks.size,
      tasks,
    };
  }

  // Stop all scheduled tasks
  public stopAllTasks(): void {
    console.log(`Stopping ${this.scheduledTasks.size} scheduled tasks...`);

    const taskKeys = Array.from(this.scheduledTasks.keys());

    taskKeys.forEach((key) => {
      try {
        const task = this.scheduledTasks.get(key);
        if (task) {
          task.destroy();
          console.log(`Stopped task: ${key}`);
        }
      } catch (error) {
        console.error(`Error stopping task ${key}:`, error);
      }
      // Always remove from map
      this.scheduledTasks.delete(key);
    });

    console.log("All scheduled tasks stopped");
  }

  // PRIVATE HELPER METHODS

  private validateCronExpression(expression: string): boolean {
    try {
      const testTask = cron.schedule(expression, () => {});
      testTask.destroy();
      return true;
    } catch (error) {
      console.error(`Invalid cron expression: ${expression}`, error);
      return false;
    }
  }

  private dateToCronExpression(date: Date): string {
    // Check if date is in the past
    if (date <= new Date()) {
      console.warn(`Warning: Scheduled date ${date.toISOString()} is in the past`);
      // Schedule for 1 minute from now as fallback
      const fallbackDate = new Date();
      fallbackDate.setMinutes(fallbackDate.getMinutes() + 1);

      const minute = fallbackDate.getMinutes();
      const hour = fallbackDate.getHours();
      const day = fallbackDate.getDate();
      const month = fallbackDate.getMonth() + 1;

      return `${minute} ${hour} ${day} ${month} *`;
    }

    const minute = date.getMinutes();
    const hour = date.getHours();
    const day = date.getDate();
    const month = date.getMonth() + 1;

    // Format: minute hour day month *
    return `${minute} ${hour} ${day} ${month} *`;
  }

  private cancelScheduledTask(taskKey: string): void {
    const existingTask = this.scheduledTasks.get(taskKey);
    if (existingTask) {
      try {
        existingTask.destroy();
        this.scheduledTasks.delete(taskKey);
        console.log(`Cancelled existing task: ${taskKey}`);
      } catch (error) {
        console.error(`Error cancelling task ${taskKey}:`, error);
        // Still remove from map even if destroy fails
        this.scheduledTasks.delete(taskKey);
      }
    }
  }

  private async cancelExpiredBooking(bookingId: number): Promise<void> {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        items: {
          include: {
            room: true,
          },
        },
      },
    });

    if (!booking) {
      console.log(`Booking ${bookingId} not found`);
      return;
    }

    if (booking.status !== BookingStatus.waiting_for_payment) {
      console.log(`Booking ${booking.bookingNo} is no longer waiting for payment`);
      return;
    }

    await prisma.$transaction(async (tx) => {
      // Update booking status to expired
      await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: BookingStatus.expired,
          cancelledAt: new Date(),
          cancelReason: "Payment deadline exceeded - automatically cancelled by system",
        },
      });

      // Release room units
      for (const item of booking.items) {
        const dates = BookingUtils.getDateRange(booking.checkIn, booking.checkOut);
        
        for (const date of dates) {
          await tx.roomAvailability.updateMany({
            where: {
              roomId: item.roomId,
              date: date,
            },
            data: {
              bookedUnits: {
                decrement: item.unitCount,
              },
            },
          });
        }
      }
    });

    console.log(`Booking ${booking.bookingNo} automatically cancelled due to payment deadline`);

    // TODO: Send cancellation email to user
  }

  private async sendCheckInReminder(bookingId: number): Promise<void> {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        user: true,
        items: {
          include: {
            room: {
              include: {
                property: true,
              },
            },
          },
        },
      },
    });

    if (!booking) {
      console.log(`Booking ${bookingId} not found for check-in reminder`);
      return;
    }

    if (booking.status !== BookingStatus.confirmed) {
      console.log(`Booking ${booking.bookingNo} is not confirmed, skipping reminder`);
      return;
    }

    console.log(
      `Should send check-in reminder to: ${booking.user.email} for booking: ${booking.bookingNo}`
    );

    // TODO: Send check-in reminder email
    // await this.emailService.sendCheckInReminder(booking);
  }
}