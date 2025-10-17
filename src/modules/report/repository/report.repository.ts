import { PrismaClient } from "../../../generated/prisma";
import { SalesReportRequest, PropertyReportRequest } from "../dto/report.dto";

export class ReportRepository {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async getBookingsForSalesReport(tenantId: number, filters: SalesReportRequest) {
    const whereClause: any = {
      items: {
        some: {
          room: {
            property: {
              tenantId: tenantId,
            },
          },
        },
      },
      status: {
        in: ["confirmed", "completed"],
      },
    };

    if (filters.propertyId) {
      whereClause.items.some.room.property.id = filters.propertyId;
    }

    if (filters.userId) {
      whereClause.userId = filters.userId;
    }

    if (filters.startDate && filters.endDate) {
      whereClause.createdAt = {
        gte: new Date(filters.startDate),
        lte: new Date(filters.endDate),
      };
    }

    return await this.prisma.booking.findMany({
      where: whereClause,
      include: {
        items: {
          include: {
            room: {
              include: {
                property: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async getPropertiesForReport(tenantId: number, filters: PropertyReportRequest) {
    return await this.prisma.property.findMany({
      where: {
        tenantId: tenantId,
        deletedAt: null,
      },
      include: {
        rooms: {
          where: {
            deletedAt: null,
          },
          include: {
            availability:
              filters.startDate && filters.endDate
                ? {
                    where: {
                      date: {
                        gte: new Date(filters.startDate),
                        lte: new Date(filters.endDate),
                      },
                    },
                  }
                : true,
          },
        },
      },
    });
  }

  // Get bookings for specific rooms and date range (for calendar integration)
  async getBookingsForRooms(
    roomIds: number[],
    startDate: Date,
    endDate: Date
  ) {
    return await this.prisma.bookingItem.findMany({
      where: {
        roomId: { in: roomIds },
        booking: {
          status: { in: ["waiting_for_payment", "confirmed"] }, // only active bookings
          checkIn: { lte: endDate },
          checkOut: { gte: startDate },
        },
      },
      select: {
        roomId: true,
        unitCount: true,
        booking: {
          select: {
            checkIn: true,
            checkOut: true,
            status: true,
            totalGuests: true,
            bookingNo: true,
          },
        },
      },
    });
  }

  // Get availability data for rooms
  async getAvailabilityForRooms(roomIds: number[], startDate: Date, endDate: Date) {
    return await this.prisma.roomAvailability.findMany({
      where: {
        roomId: { in: roomIds },
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
    });
  }

  // Get previous period data for growth calculation
  async getPreviousPeriodBookings(tenantId: number, filters: SalesReportRequest, previousStartDate: Date, previousEndDate: Date) {
    const whereClause: any = {
      items: {
        some: {
          room: {
            property: {
              tenantId: tenantId,
            },
          },
        },
      },
      status: {
        in: ["confirmed", "completed"],
      },
      createdAt: {
        gte: previousStartDate,
        lte: previousEndDate,
      },
    };

    if (filters.propertyId) {
      whereClause.items.some.room.property.id = filters.propertyId;
    }

    if (filters.userId) {
      whereClause.userId = filters.userId;
    }

    return await this.prisma.booking.findMany({
      where: whereClause,
      include: {
        items: {
          include: {
            room: {
              include: {
                property: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }
}