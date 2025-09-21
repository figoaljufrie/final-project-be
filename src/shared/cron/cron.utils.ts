import * as cron from "node-cron";

export class CronUtils {
  // Validate cron expression
  static validateCronExpression(expression: string): boolean {
    try {
      return cron.validate(expression);
    } catch (error) {
      return false;
    }
  }

  // Convert date to cron expression
  static dateToCronExpression(date: Date): string {
    const now = new Date();
    
    // If date is in the past, schedule for next minute
    if (date <= now) {
      const nextMinute = new Date(now.getTime() + 60000);
      return `${nextMinute.getSeconds()} ${nextMinute.getMinutes()} ${nextMinute.getHours()} ${nextMinute.getDate()} ${nextMinute.getMonth() + 1} *`;
    }

    // Convert date to cron expression
    const seconds = date.getSeconds();
    const minutes = date.getMinutes();
    const hours = date.getHours();
    const day = date.getDate();
    const month = date.getMonth() + 1;

    return `${seconds} ${minutes} ${hours} ${day} ${month} *`;
  }

  // Generate task key for auto-cancel
  static generateAutoCancelTaskKey(bookingId: number): string {
    return `auto-cancel-${bookingId}`;
  }

  // Generate task key for check-in reminder
  static generateCheckInReminderTaskKey(bookingId: number): string {
    return `checkin-reminder-${bookingId}`;
  }

  // Calculate check-in reminder date (1 day before at 10 AM)
  static calculateCheckInReminderDate(checkInDate: Date): Date {
    const reminderDate = new Date(checkInDate);
    reminderDate.setDate(reminderDate.getDate() - 1);
    reminderDate.setHours(10, 0, 0, 0); // 10 AM
    return reminderDate;
  }

  // Check if reminder date is in the past
  static isReminderDateInPast(reminderDate: Date): boolean {
    return reminderDate < new Date();
  }

  // Get task status info
  static getTaskStatusInfo(task: cron.ScheduledTask, key: string): any {
    return {
      key,
      running: task.getStatus() === 'scheduled',
      nextRun: null, // nextDate() method doesn't exist, so we return null
    };
  }
}
