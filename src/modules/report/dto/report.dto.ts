export interface SalesReportRequest {
  propertyId?: number | undefined;
  userId?: number | undefined;
  startDate?: string | undefined;
  endDate?: string | undefined;
  sortBy?: 'date' | 'totalSales' | 'user' | 'property' | undefined;
  sortOrder?: 'asc' | 'desc' | undefined;
  page?: number | undefined;
  limit?: number | undefined;
  includeGrowth?: boolean | undefined;
}

export interface SalesReportResponse {
  totalSales: number;
  totalBookings: number;
  totalGuests: number;
  averageBookingValue: number;
  reports: SalesReportItem[];
  growthMetrics?: {
    revenueGrowth: number;
    bookingGrowth: number;
    guestGrowth: number;
  } | undefined;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface SalesReportItem {
  id: string;
  type: 'property' | 'transaction' | 'user';
  name: string;
  totalSales: number;
  totalBookings: number;
  totalGuests: number;
  averageValue: number;
  date: string;
  details?: {
    propertyId?: number;
    propertyName?: string;
    userId?: number;
    userName?: string;
    userEmail?: string;
    bookingId?: number;
    bookingNo?: string;
    totalGuests?: number;
    nights?: number;
    items?: any[];
  };
}

export interface PropertyReportRequest {
  propertyId?: number | undefined;
  startDate?: string | undefined;
  endDate?: string | undefined;
  includeCalendar?: boolean | undefined;
  includeOccupancy?: boolean | undefined;
}

export interface PropertyReportResponse {
  properties: PropertyReportItem[];
  calendar: CalendarAvailability[];
}

export interface PropertyReportItem {
  propertyId: number;
  propertyName: string;
  totalRooms: number;
  availableRooms: number;
  bookedRooms: number;
  occupancyRate: number;
  totalRevenue: number;
  averageDailyRate: number;
  revenuePerAvailableRoom: number;
  totalGuests: number;
  averageStayDuration: number;
}

export interface CalendarAvailability {
  date: string;
  propertyId: number;
  propertyName: string;
  rooms: RoomAvailabilityItem[];
}

export interface RoomAvailabilityItem {
  roomId: number;
  roomName: string;
  totalUnits: number;
  bookedUnits: number;
  availableUnits: number;
  status: 'available' | 'fully_booked' | 'partially_booked';
}