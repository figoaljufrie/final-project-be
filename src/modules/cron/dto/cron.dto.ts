export interface CronTaskData {
  taskId: string;
  bookingId: number;
  bookingNo: string;
  scheduledAt: Date;
  taskType: 'auto-cancel' | 'check-in-reminder';
  status: 'scheduled' | 'executed' | 'cancelled';
}

export interface ScheduleTaskRequest {
  bookingId: number;
  bookingNo: string;
  scheduledAt: Date;
  taskType: 'auto-cancel' | 'check-in-reminder';
}

export interface CancelTaskRequest {
  bookingId: number;
  taskType?: 'auto-cancel' | 'check-in-reminder';
}

export interface SendReminderRequest {
  bookingId: number;
  reminderType: 'checkin' | 'payment';
}
