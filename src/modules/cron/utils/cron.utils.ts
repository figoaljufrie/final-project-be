export class CronUtils {
  // Generate unique task ID
  static generateTaskId(type: string, bookingId: number): string {
    return `${type}-${bookingId}`;
  }

  // Calculate cron expression for specific date
  static getCronExpression(date: Date): string {
    const minutes = date.getMinutes();
    const hours = date.getHours();
    const day = date.getDate();
    const month = date.getMonth() + 1;
    
    return `${minutes} ${hours} ${day} ${month} *`;
  }

  // Check if date is in the past
  static isDateInPast(date: Date): boolean {
    return date.getTime() < Date.now();
  }

  // Format date for logging
  static formatDate(date: Date): string {
    return date.toISOString();
  }

  // Calculate reminder date (H-1)
  static getCheckInReminderDate(checkInDate: Date): Date {
    const reminderDate = new Date(checkInDate);
    reminderDate.setHours(reminderDate.getHours() - 24); // H-1
    return reminderDate;
  }

  // Calculate auto-cancel warning date (30 min before deadline)
  static getAutoCancelWarningDate(deadline: Date): Date {
    const warningDate = new Date(deadline);
    warningDate.setMinutes(warningDate.getMinutes() - 30); // 30 min before
    return warningDate;
  }
}
