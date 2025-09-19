import { $Enums } from "../../../../generated/prisma";

// ===== TENANT BOOKING FILTERS =====
export interface TenantBookingFilter {
  tenantId: number;
  status?: $Enums.BookingStatus;
  propertyId?: number;
  roomId?: number;
  bookingNo?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

// ===== TENANT BOOKING RESPONSE =====
export interface TenantBookingResponse {
  id: number;
  bookingNo: string;
  status: $Enums.BookingStatus;
  checkIn: Date;
  checkOut: Date;
  totalGuests: number;
  totalAmount: number;
  paymentMethod: $Enums.PaymentMethod;
  paymentProofUrl?: string;
  paymentDeadline: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  
  // User details
  user: {
    id: number;
    name: string;
    email: string;
    phone?: string;
  };
  
  // Property & Room details
  property: {
    id: number;
    name: string;
    address: string;
  };
  
  room: {
    id: number;
    name: string;
    basePrice: number;
  };
  
  // Booking items
  bookingItems: {
    id: number;
    unitCount: number;
    totalPrice: number;
    date: Date;
    customPrice?: number;
    priceModifier?: number;
  }[];
}

// ===== TENANT BOOKING DETAILS =====
export interface TenantBookingDetailsResponse extends TenantBookingResponse {
  // Additional details for tenant view
  totalNights: number;
  totalUnits: number;
  averagePricePerNight: number;
  
  // Payment history
  paymentHistory: {
    id: number;
    amount: number;
    method: $Enums.PaymentMethod;
    status: string;
    createdAt: Date;
  }[];
}

// ===== CONFIRM/REJECT PAYMENT =====
export interface ConfirmPaymentRequest {
  bookingId: number;
  tenantId: number;
  action: 'confirm' | 'reject';
  notes?: string;
}

export interface ConfirmPaymentResponse {
  id: number;
  bookingNo: string;
  status: $Enums.BookingStatus;
  updatedAt: Date;
  message: string;
}

// ===== TENANT PROPERTIES =====
export interface TenantPropertyResponse {
  id: number;
  name: string;
  address: string;
  description?: string;
  isPublished: boolean;
  createdAt: Date;
  
  // Statistics
  totalRooms: number;
  totalBookings: number;
  totalRevenue: number;
  averageRating: number;
  
  // Rooms
  rooms: {
    id: number;
    name: string;
    basePrice: number;
    totalUnits: number;
    availableUnits: number;
  }[];
}

// ===== TENANT BOOKING STATISTICS =====
export interface TenantBookingStatsResponse {
  // Overall stats
  totalBookings: number;
  totalRevenue: number;
  averageBookingValue: number;
  
  // Status breakdown
  statusBreakdown: {
    pending: number;
    confirmed: number;
    waiting_for_confirmation: number;
    cancelled: number;
    completed: number;
  };
  
  // Time-based stats
  thisMonth: {
    bookings: number;
    revenue: number;
  };
  
  lastMonth: {
    bookings: number;
    revenue: number;
  };
  
  // Top performing properties
  topProperties: {
    id: number;
    name: string;
    bookings: number;
    revenue: number;
  }[];
}

// ===== PAGINATION RESPONSE =====
export interface TenantBookingListResponse {
  bookings: TenantBookingResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}