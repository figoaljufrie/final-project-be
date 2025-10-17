import { ReportRepository } from '../repository/report.repository';
import { SalesReportRequest, SalesReportResponse, PropertyReportRequest, PropertyReportResponse } from '../dto/report.dto';
import { ApiError } from '../../../shared/utils/api-error';

export class ReportService {
  private reportRepository: ReportRepository;

  constructor(reportRepository: ReportRepository) {
    this.reportRepository = reportRepository;
  }

  async getSalesReport(tenantId: number, filters: SalesReportRequest): Promise<SalesReportResponse> {
    try {
      const { sortBy = 'date', sortOrder = 'desc', page = 1, limit = 10, includeGrowth = false } = filters;
      
      // Get current period data
      const currentBookings = await this.reportRepository.getBookingsForSalesReport(tenantId, filters);
      
      // Get previous period data for growth calculation if requested
      let previousBookings: any[] = [];
      if (includeGrowth) {
        const currentStartDate = new Date(filters.startDate || new Date());
        const currentEndDate = new Date(filters.endDate || new Date());
        const periodLength = currentEndDate.getTime() - currentStartDate.getTime();
        
        const previousEndDate = new Date(currentStartDate.getTime() - 1);
        const previousStartDate = new Date(previousEndDate.getTime() - periodLength);
        
        previousBookings = await this.reportRepository.getPreviousPeriodBookings(
          tenantId, 
          filters, 
          previousStartDate, 
          previousEndDate
        );
      }
      
      // Business logic: Group and process data
      const [propertyReports, transactionReports, userReports] = await Promise.all([
        this.groupSalesByProperty(currentBookings),
        this.groupSalesByTransaction(currentBookings),
        this.groupSalesByUser(currentBookings)
      ]);
      
      // Combine all reports
      const allReports = [...propertyReports, ...transactionReports, ...userReports];
      
      // Sort reports
      allReports.sort((a, b) => {
        if (sortBy === 'totalSales') {
          return sortOrder === 'asc' ? a.totalSales - b.totalSales : b.totalSales - a.totalSales;
        } else if (sortBy === 'user') {
          return sortOrder === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
        } else if (sortBy === 'property') {
          return sortOrder === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
        } else {
          return sortOrder === 'asc' ? 
            new Date(a.date).getTime() - new Date(b.date).getTime() :
            new Date(b.date).getTime() - new Date(a.date).getTime();
        }
      });
      
      // Calculate totals
      const totalSales = allReports.reduce((sum, report) => sum + report.totalSales, 0);
      const totalBookings = allReports.reduce((sum, report) => sum + report.totalBookings, 0);
      const totalGuests = allReports.reduce((sum, report) => sum + report.totalGuests, 0);
      const averageBookingValue = totalBookings > 0 ? totalSales / totalBookings : 0;
      
      // Calculate growth metrics if requested
      let growthMetrics: { revenueGrowth: number; bookingGrowth: number; guestGrowth: number } | undefined;
      if (includeGrowth && previousBookings.length > 0) {
        growthMetrics = this.calculateGrowthMetrics(currentBookings, previousBookings);
      }
      
      // Pagination
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedReports = allReports.slice(startIndex, endIndex);
      
      return {
        totalSales,
        totalBookings,
        totalGuests,
        averageBookingValue: Math.round(averageBookingValue * 100) / 100,
        reports: paginatedReports,
        growthMetrics,
        pagination: {
          page,
          limit,
          total: allReports.length,
          totalPages: Math.ceil(allReports.length / limit)
        }
      };
    } catch (error) {
      throw new ApiError('Failed to generate sales report', 500);
    }
  }

  async getPropertyReport(tenantId: number, filters: PropertyReportRequest): Promise<PropertyReportResponse> {
    try {
      const properties = await this.reportRepository.getPropertiesForReport(tenantId, filters);
      return this.processPropertyReport(properties, filters);
    } catch (error) {
      throw new ApiError('Failed to generate property report', 500);
    }
  }

  // Get calendar data with booking information for specific rooms
  async getCalendarWithBookings(roomIds: number[], startDate: Date, endDate: Date) {
    try {
      const [bookings, availability] = await Promise.all([
        this.reportRepository.getBookingsForRooms(roomIds, startDate, endDate),
        this.reportRepository.getAvailabilityForRooms(roomIds, startDate, endDate)
      ]);

      return {
        bookings,
        availability,
        // Process data to show availability status with reasons
        calendarData: this.processCalendarData(bookings, availability, startDate, endDate)
      };
    } catch (error) {
      throw new ApiError('Failed to get calendar data', 500);
    }
  }

  // Business logic methods

  private groupSalesByProperty(bookings: any[]) {
    const grouped = new Map();

    bookings.forEach((booking) => {
      booking.items.forEach((item: any) => {
        const propertyId = item.room.property.id;
        const propertyName = item.room.property.name;

        if (!grouped.has(propertyId)) {
          grouped.set(propertyId, {
            id: `property-${propertyId}`,
            type: "property",
            name: propertyName,
            totalSales: 0,
            totalBookings: 0,
            totalGuests: 0,
            averageValue: 0,
            date: booking.createdAt.toISOString().split("T")[0],
            details: {
              propertyId: propertyId,
              propertyName: propertyName,
              totalGuests: booking.totalGuests || 0,
              nights: this.calculateNights(booking.checkIn, booking.checkOut),
            },
          });
        }

        const group = grouped.get(propertyId);
        group.totalSales += item.subTotal;
        group.totalBookings += 1;
        group.totalGuests += booking.totalGuests || 0;
        group.averageValue = group.totalSales / group.totalBookings;
      });
    });

    return Array.from(grouped.values());
  }

  private groupSalesByTransaction(bookings: any[]) {
    return bookings.map((booking) => ({
      id: `transaction-${booking.id}`,
      type: "transaction",
      name: `Booking ${booking.bookingNo}`,
      totalSales: booking.totalAmount,
      totalBookings: 1,
      totalGuests: booking.totalGuests || 0,
      averageValue: booking.totalAmount,
      date: booking.createdAt.toISOString().split("T")[0],
      details: {
        bookingId: booking.id,
        bookingNo: booking.bookingNo,
        user: booking.user,
        items: booking.items,
        totalGuests: booking.totalGuests || 0,
        nights: this.calculateNights(booking.checkIn, booking.checkOut),
      },
    }));
  }

  private groupSalesByUser(bookings: any[]) {
    const grouped = new Map();

    bookings.forEach((booking) => {
      const userId = booking.user.id;
      const userName = booking.user.name || booking.user.email;

      if (!grouped.has(userId)) {
        grouped.set(userId, {
          id: `user-${userId}`,
          type: "user",
          name: userName,
          totalSales: 0,
          totalBookings: 0,
          totalGuests: 0,
          averageValue: 0,
          date: booking.createdAt.toISOString().split("T")[0],
          details: {
            userId: userId,
            userName: userName,
            userEmail: booking.user.email,
            totalGuests: booking.totalGuests || 0,
            nights: this.calculateNights(booking.checkIn, booking.checkOut),
          },
        });
      }

      const group = grouped.get(userId);
      group.totalSales += booking.totalAmount;
      group.totalBookings += 1;
      group.totalGuests += booking.totalGuests || 0;
      group.averageValue = group.totalSales / group.totalBookings;
    });

    return Array.from(grouped.values());
  }

  private processPropertyReport(properties: any[], filters: PropertyReportRequest) {
    const propertyReports = properties.map((property) => {
      const totalRooms = property.rooms.length;
      let availableRooms = 0;
      let bookedRooms = 0;
      let totalRevenue = 0;
      let totalGuests = 0;
      let totalNights = 0;
      let totalBookings = 0;

      property.rooms.forEach((room: any) => {
        if (room.availability.length > 0) {
          const totalUnits = room.totalUnits;
          const bookedUnits = room.availability.reduce(
            (sum: number, avail: any) => sum + avail.bookedUnits,
            0
          );
          const availableUnits = totalUnits - bookedUnits;

          if (availableUnits > 0) availableRooms++;
          if (bookedUnits > 0) bookedRooms++;

          // Calculate revenue from bookings
          const roomRevenue = room.availability.reduce(
            (sum: number, avail: any) => sum + (avail.bookedUnits * room.basePrice),
            0
          );
          totalRevenue += roomRevenue;
        }
      });

      // Get booking data for additional metrics
      const propertyBookings = property.rooms.flatMap((room: any) => 
        room.availability.filter((avail: any) => avail.bookedUnits > 0)
      );

      totalBookings = propertyBookings.length;
      totalGuests = propertyBookings.reduce((sum: number, avail: any) => 
        sum + (avail.bookedUnits * 2), 0 // Assume 2 guests per room
      );
      totalNights = propertyBookings.reduce((sum: number, avail: any) => 
        sum + this.calculateNights(avail.date, new Date(avail.date.getTime() + 24 * 60 * 60 * 1000)), 0
      );

      const occupancyRate = totalRooms > 0 ? (bookedRooms / totalRooms) * 100 : 0;
      const averageDailyRate = totalBookings > 0 ? totalRevenue / totalBookings : 0;
      const revenuePerAvailableRoom = totalRooms > 0 ? totalRevenue / totalRooms : 0;
      const averageStayDuration = totalBookings > 0 ? totalNights / totalBookings : 0;

      return {
        propertyId: property.id,
        propertyName: property.name,
        totalRooms,
        availableRooms,
        bookedRooms,
        occupancyRate: Math.round(occupancyRate * 100) / 100,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        averageDailyRate: Math.round(averageDailyRate * 100) / 100,
        revenuePerAvailableRoom: Math.round(revenuePerAvailableRoom * 100) / 100,
        totalGuests,
        averageStayDuration: Math.round(averageStayDuration * 100) / 100,
      };
    });

    const calendar = filters.includeCalendar !== false 
      ? this.generateCalendarAvailability(properties, filters)
      : [];

    return {
      properties: propertyReports,
      calendar,
    };
  }

  private generateCalendarAvailability(properties: any[], filters: PropertyReportRequest) {
    const calendar: any[] = [];
    const startDate = filters.startDate
      ? new Date(filters.startDate)
      : new Date();
    const endDate = filters.endDate
      ? new Date(filters.endDate)
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    for (
      let date = new Date(startDate);
      date <= endDate;
      date.setDate(date.getDate() + 1)
    ) {
      const dateStr = date.toISOString().split("T")[0];

      properties.forEach((property) => {
        const rooms = property.rooms.map((room: any) => {
          const availability = room.availability.find(
            (avail: any) => avail.date.toISOString().split("T")[0] === dateStr
          );

          const totalUnits = room.totalUnits;
          const bookedUnits = availability ? availability.bookedUnits : 0;
          const availableUnits = totalUnits - bookedUnits;

          let status: "available" | "fully_booked" | "partially_booked";
          if (availableUnits === 0) status = "fully_booked";
          else if (bookedUnits > 0) status = "partially_booked";
          else status = "available";

          return {
            roomId: room.id,
            roomName: room.name,
            totalUnits,
            bookedUnits,
            availableUnits,
            status,
          };
        });

        calendar.push({
          date: dateStr,
          propertyId: property.id,
          propertyName: property.name,
          rooms,
        });
      });
    }

    return calendar;
  }

  private calculateGrowthMetrics(currentBookings: any[], previousBookings: any[]) {
    // Calculate totals for current period
    const currentTotalSales = currentBookings.reduce((sum, booking) => sum + booking.totalAmount, 0);
    const currentTotalBookings = currentBookings.length;
    const currentTotalGuests = currentBookings.reduce((sum, booking) => sum + (booking.totalGuests || 0), 0);

    // Calculate totals for previous period
    const previousTotalSales = previousBookings.reduce((sum, booking) => sum + booking.totalAmount, 0);
    const previousTotalBookings = previousBookings.length;
    const previousTotalGuests = previousBookings.reduce((sum, booking) => sum + (booking.totalGuests || 0), 0);

    // Calculate growth percentages
    const revenueGrowth = previousTotalSales > 0 
      ? ((currentTotalSales - previousTotalSales) / previousTotalSales) * 100 
      : 0;
    
    const bookingGrowth = previousTotalBookings > 0 
      ? ((currentTotalBookings - previousTotalBookings) / previousTotalBookings) * 100 
      : 0;
    
    const guestGrowth = previousTotalGuests > 0 
      ? ((currentTotalGuests - previousTotalGuests) / previousTotalGuests) * 100 
      : 0;

    return {
      revenueGrowth: Math.round(revenueGrowth * 100) / 100,
      bookingGrowth: Math.round(bookingGrowth * 100) / 100,
      guestGrowth: Math.round(guestGrowth * 100) / 100,
    };
  }

  // Process calendar data with availability status and reasons
  private processCalendarData(bookings: any[], availability: any[], startDate: Date, endDate: Date) {
    const calendarData: any[] = [];
    
    // Group bookings by room and date
    const bookingsByRoomAndDate = new Map();
    bookings.forEach(booking => {
      const roomId = booking.roomId;
      const checkIn = new Date(booking.booking.checkIn);
      const checkOut = new Date(booking.booking.checkOut);
      
      // For each date in the booking range
      for (let date = new Date(checkIn); date < checkOut; date.setDate(date.getDate() + 1)) {
        const dateKey = `${roomId}-${date.toISOString().split('T')[0]}`;
        if (!bookingsByRoomAndDate.has(dateKey)) {
          bookingsByRoomAndDate.set(dateKey, []);
        }
        bookingsByRoomAndDate.get(dateKey).push({
          unitCount: booking.unitCount,
          status: booking.booking.status,
          bookingNo: booking.booking.bookingNo,
          totalGuests: booking.booking.totalGuests
        });
      }
    });

    // Group availability by room and date
    const availabilityByRoomAndDate = new Map();
    availability.forEach(avail => {
      const dateKey = `${avail.roomId}-${avail.date.toISOString().split('T')[0]}`;
      availabilityByRoomAndDate.set(dateKey, avail);
    });

    // Generate calendar data for each date in range
    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
      const dateStr = date.toISOString().split('T')[0];
      
      // Get all unique room IDs from bookings and availability
      const allRoomIds = new Set([
        ...bookings.map(b => b.roomId),
        ...availability.map(a => a.roomId)
      ]);

      allRoomIds.forEach(roomId => {
        const dateKey = `${roomId}-${dateStr}`;
        const roomBookings = bookingsByRoomAndDate.get(dateKey) || [];
        const roomAvailability = availabilityByRoomAndDate.get(dateKey);
        
        // Calculate total booked units for this room on this date
        const totalBookedUnits = roomBookings.reduce((sum: number, booking: any) => sum + booking.unitCount, 0);
        
        // Get total units (from availability or default to 1)
        const totalUnits = roomAvailability?.totalUnits || 1;
        const availableUnits = Math.max(0, totalUnits - totalBookedUnits);
        
        // Determine status and reason
        let status: 'available' | 'partially_booked' | 'fully_booked' | 'unavailable';
        let reason: string | null = null;
        
        if (roomAvailability && !roomAvailability.isAvailable) {
          status = 'unavailable';
          reason = roomAvailability.reason || 'Not available';
        } else if (availableUnits === 0) {
          status = 'fully_booked';
          reason = `Fully booked (${totalBookedUnits}/${totalUnits} units)`;
        } else if (totalBookedUnits > 0) {
          status = 'partially_booked';
          reason = `Partially booked (${totalBookedUnits}/${totalUnits} units)`;
        } else {
          status = 'available';
          reason = null;
        }

        calendarData.push({
          date: dateStr,
          roomId,
          totalUnits,
          bookedUnits: totalBookedUnits,
          availableUnits,
          status,
          reason,
          bookings: roomBookings,
          isAvailable: roomAvailability?.isAvailable ?? true,
          customPrice: roomAvailability?.customPrice,
          priceModifier: roomAvailability?.priceModifier
        });
      });
    }

    return calendarData;
  }

  // Helper method to calculate nights between dates
  private calculateNights(checkIn: Date, checkOut: Date): number {
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const timeDiff = checkOutDate.getTime() - checkInDate.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  }
}