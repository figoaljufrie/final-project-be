import { $Enums } from "../../../../generated/prisma";

export interface TenantBookingFilter {
  tenantId?: number;
  status?: $Enums.BookingStatus;
  bookingNo?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface TenantBookingListResponse {
  bookings: TenantBookingWithDetails[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface TenantBookingWithDetails {
  id: number;
  bookingNo: string;
  userId: number;
  status: $Enums.BookingStatus;
  totalAmount: number;
  paymentMethod?: $Enums.PaymentMethod;
  paymentProofUrl?: string;
  paymentDeadline?: Date;
  checkIn: Date;
  checkOut: Date;
  totalGuests: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: number;
    name: string;
    email: string;
    avatarUrl?: string;
  };
  items: TenantBookingItemWithRoom[];
}

export interface TenantBookingItemWithRoom {
  id: number;
  roomId: number;
  unitCount: number;
  unitPrice: number;
  nights: number;
  subTotal: number;
  room: {
    id: number;
    name: string;
    capacity: number;
    basePrice: number;
    property: {
      id: number;
      name: string;
      address?: string;
      city?: string;
      tenantId: number;
    };
  };
}

export interface ConfirmPaymentRequest {
  bookingId: number;
  tenantId: number;
  confirmationNotes?: string;
}

export interface RejectPaymentRequest {
  bookingId: number;
  tenantId: number;
  rejectionReason: string;
}

export interface CancelUserOrderRequest {
  bookingId: number;
  tenantId: number;
  cancelReason: string;
}

export interface SendReminderRequest {
  bookingId: number;
  tenantId: number;
  reminderType: 'payment' | 'checkin';
}