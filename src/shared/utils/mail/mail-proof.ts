import { createTransport, Transporter } from "nodemailer";
import Handlebars from "handlebars";
import path from "path";
import fs from "fs/promises";
import { ApiError } from "../api-error";

// Email data interface for booking notifications
export interface BookingEmailData {
  // Common fields
  userName: string;
  userEmail: string;
  bookingNo: string;
  propertyName: string;
  checkIn: string;
  checkOut: string;
  totalAmount: string;
  
  // Specific fields
  tenantName?: string;
  tenantEmail?: string; // Added for tenant email notifications
  paymentMethod?: string;
  confirmationNotes?: string;
  rejectionReason?: string;
  cancellationReason?: string;
  propertyAddress?: string;
  contactPerson?: string;
  contactNumber?: string;
  paymentDeadline?: string;
  timeRemaining?: string;
  
  // URLs
  dashboardUrl?: string;
  bookingUrl?: string;
  paymentUrl?: string;
}

export class MailProofService {
  private transporter: Transporter;

  constructor() {
    this.transporter = createTransport({
      service: "gmail",
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASSWORD,
      },
    });
  }

  // Generic email sending method
  private async sendEmail(
    to: string,
    subject: string,
    templateName: string,
    context: BookingEmailData
  ): Promise<void> {
    try {
      // Validate email parameters
      if (!to || !subject || !templateName) {
        throw new ApiError('Missing required email parameters', 400);
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(to)) {
        throw new ApiError('Invalid email format', 400);
      }

      const templateDir = path.resolve(__dirname, "templates");
      const templatePath = path.join(templateDir, `${templateName}.hbs`);

      // Check if template exists
      try {
        await fs.access(templatePath);
      } catch (error) {
        throw new ApiError(`Template ${templateName} not found`, 404);
      }

      const templateSource = await fs.readFile(templatePath, "utf-8");
      const compiledTemplate = Handlebars.compile(templateSource);
      const html = compiledTemplate(context);

      await this.transporter.sendMail({
        from: process.env.MAIL_USER,
        to,
        subject,
        html,
      });

      console.log(`Email sent successfully to ${to} with template ${templateName}`);
    } catch (error) {
      console.error('Email sending failed:', error);
      throw new ApiError('Failed to send email', 500);
    }
  }

  // 1. Payment proof uploaded (to tenant) - FEATURE 2 REQUIREMENT
  async sendPaymentProofUploadedEmail(data: BookingEmailData): Promise<void> {
    const tenantEmail = data.tenantEmail || data.userEmail; // Fallback to userEmail if tenantEmail not provided
    await this.sendEmail(
      tenantEmail,
      `New Payment Proof Uploaded - Booking ${data.bookingNo}`,
      'payment-proof-uploaded',
      data
    );
  }

  // 2. Payment confirmed (to user) - FEATURE 2 REQUIREMENT
  async sendPaymentConfirmedEmail(data: BookingEmailData): Promise<void> {
    await this.sendEmail(
      data.userEmail,
      `Payment Confirmed - Booking ${data.bookingNo}`,
      'payment-confirmed',
      data
    );
  }

  // 3. Payment rejected (to user) - FEATURE 2 REQUIREMENT
  async sendPaymentRejectedEmail(data: BookingEmailData): Promise<void> {
    await this.sendEmail(
      data.userEmail,
      `Payment Rejected - Booking ${data.bookingNo}`,
      'payment-rejected',
      data
    );
  }

  // 4. Booking cancelled (to user) - FEATURE 2 REQUIREMENT
  async sendBookingCancelledEmail(data: BookingEmailData): Promise<void> {
    await this.sendEmail(
      data.userEmail,
      `Booking Cancelled - ${data.bookingNo}`,
      'booking-cancelled',
      data
    );
  }

  // 5. Check-in reminder (to user) - FEATURE 2 REQUIREMENT
  async sendCheckInReminderEmail(data: BookingEmailData): Promise<void> {
    await this.sendEmail(
      data.userEmail,
      `Check-in Reminder - Booking ${data.bookingNo}`,
      'check-in-reminder',
      data
    );
  }

  // 6. Auto-cancel reminder (to user) - FEATURE 2 REQUIREMENT
  async sendAutoCancelReminderEmail(data: BookingEmailData): Promise<void> {
    await this.sendEmail(
      data.userEmail,
      `Payment Deadline Reminder - Booking ${data.bookingNo}`,
      'auto-cancel-reminder',
      data
    );
  }

  // 7. Payment deadline warning (to user) - FEATURE 2 REQUIREMENT
  async sendPaymentDeadlineWarningEmail(data: BookingEmailData): Promise<void> {
    await this.sendEmail(
      data.userEmail,
      `Payment Deadline Warning - Booking ${data.bookingNo}`,
      'payment-deadline-warning',
      data
    );
  }

  // 8. Booking completed (to user and tenant) - FEATURE 2 REQUIREMENT
  async sendBookingCompletedEmail(data: BookingEmailData): Promise<void> {
    // Send to user
    await this.sendEmail(
      data.userEmail,
      `Booking Completed - ${data.bookingNo}`,
      'booking-completed-user',
      data
    );

    // Send to tenant if tenant email is provided
    if (data.tenantEmail) {
      await this.sendEmail(
        data.tenantEmail,
        `Booking Completed - ${data.bookingNo}`,
        'booking-completed-tenant',
        data
      );
    }
  }
}

// Export singleton instance
export const mailProofService = new MailProofService();