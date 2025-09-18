// import { BookingStatus, PaymentMethod } from "../../generated/prisma";
import { $Enums } from "../../../generated/prisma";

export interface CreateBookingRequest {
  userId: number;
  roomId: number;
  checkIn: string; // YYYY-MM-DD
  checkOut: string; // YYYY-MM-DD
  totalGuests: number;
  unitCount: number;
  notes?: string;
}

export interface BookingResponse {
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
}

export interface BookingFilter {
  userId?: number;
  status?: $Enums.BookingStatus;
  bookingNo?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface BookingListResponse {
  bookings: BookingWithDetails[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface BookingWithDetails extends BookingResponse {
  items: BookingItemWithRoom[];
  user?: {
    id: number;
    name: string;
    email: string;
  };
}

export interface BookingItemWithRoom {
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
      images?: Array<{
        url: string;
        isPrimary: boolean;
      }>;
    };
  };
}

export interface CancelBookingRequest {
  bookingId: number;
  userId: number;
  cancelReason: string;
}

export interface UploadPaymentProofRequest {
  bookingId: number;
  userId: number;
  paymentMethod: $Enums.PaymentMethod;
}

export interface PaymentProofResponse {
  id: number;
  bookingNo: string;
  status: $Enums.BookingStatus;
  paymentMethod: $Enums.PaymentMethod;
  paymentProofUrl: string;
  updatedAt: Date;
}