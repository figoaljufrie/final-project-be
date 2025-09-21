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

  // Booking-specific email methods
  async sendPaymentProofUploadedEmail(data: BookingEmailData): Promise<void> {
    const tenantEmail = data.tenantEmail || data.userEmail; // Fallback to userEmail if tenantEmail not provided
    await this.sendEmail(
      tenantEmail,
      `New Payment Proof Uploaded - Booking ${data.bookingNo}`,
      'payment-proof-uploaded',
      data
    );
  }

  async sendPaymentConfirmedEmail(data: BookingEmailData): Promise<void> {
    await this.sendEmail(
      data.userEmail,
      `Payment Confirmed - Booking ${data.bookingNo}`,
      'payment-confirmed',
      data
    );
  }

  async sendPaymentRejectedEmail(data: BookingEmailData): Promise<void> {
    await this.sendEmail(
      data.userEmail,
      `Payment Rejected - Booking ${data.bookingNo}`,
      'payment-rejected',
      data
    );
  }

  async sendBookingCancelledEmail(data: BookingEmailData): Promise<void> {
    await this.sendEmail(
      data.userEmail,
      `Booking Cancelled - ${data.bookingNo}`,
      'booking-cancelled',
      data
    );
  }

  async sendCheckInReminderEmail(data: BookingEmailData): Promise<void> {
    await this.sendEmail(
      data.userEmail,
      `Check-in Reminder - Booking ${data.bookingNo}`,
      'check-in-reminder',
      data
    );
  }

  async sendAutoCancelReminderEmail(data: BookingEmailData): Promise<void> {
    await this.sendEmail(
      data.userEmail,
      `Payment Deadline Reminder - Booking ${data.bookingNo}`,
      'auto-cancel-reminder',
      data
    );
  }
}

// Export singleton instance
export const mailProofService = new MailProofService();