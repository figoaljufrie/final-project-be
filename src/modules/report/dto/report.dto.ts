export interface SalesReportRequest {
    propertyId?: number | undefined;
    startDate?: string | undefined;
    endDate?: string | undefined;
    sortBy?: 'date' | 'totalSales' | undefined;
    sortOrder?: 'asc' | 'desc' | undefined;
    page?: number | undefined;
    limit?: number | undefined;
  }
  
  export interface SalesReportResponse {
    totalSales: number;
    totalBookings: number;
    averageBookingValue: number;
    reports: SalesReportItem[];
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
    averageValue: number;
    date: string;
    details?: any;
  }
  
  export interface PropertyReportRequest {
    propertyId?: number | undefined;
    startDate?: string | undefined;
    endDate?: string | undefined;
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