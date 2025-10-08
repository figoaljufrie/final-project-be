import { PrismaClient } from "../../../generated/prisma";
import { SalesReportRequest, PropertyReportRequest } from "../dto/report.dto";

export class ReportRepository {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async getSalesReportByProperty(
    tenantId: number,
    filters: SalesReportRequest
  ) {
    try {
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

      if (filters.startDate && filters.endDate) {
        whereClause.createdAt = {
          gte: new Date(filters.startDate),
          lte: new Date(filters.endDate),
        };
      }

      const bookings = await this.prisma.booking.findMany({
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
        },
        orderBy: { createdAt: "desc" },
      });

      return this.groupSalesByProperty(bookings);
    } catch (error) {
      console.error("Error in getSalesReportByProperty:", error);
      throw error;
    }
  }

  async getSalesReportByTransaction(
    tenantId: number,
    filters: SalesReportRequest
  ) {
    try {
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

      if (filters.startDate && filters.endDate) {
        whereClause.createdAt = {
          gte: new Date(filters.startDate),
          lte: new Date(filters.endDate),
        };
      }

      const bookings = await this.prisma.booking.findMany({
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

      return this.groupSalesByTransaction(bookings);
    } catch (error) {
      console.error("Error in getSalesReportByTransaction:", error);
      throw error;
    }
  }

  async getSalesReportByUser(tenantId: number, filters: SalesReportRequest) {
    try {
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

      if (filters.startDate && filters.endDate) {
        whereClause.createdAt = {
          gte: new Date(filters.startDate),
          lte: new Date(filters.endDate),
        };
      }

      const bookings = await this.prisma.booking.findMany({
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

      return this.groupSalesByUser(bookings);
    } catch (error) {
      console.error("Error in getSalesReportByUser:", error);
      throw error;
    }
  }

  async getPropertyReport(tenantId: number, filters: PropertyReportRequest) {
    const properties = await this.prisma.property.findMany({
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

    return this.processPropertyReport(properties, filters);
  }

  private getOrderBy(sortBy?: string, sortOrder?: string) {
    if (sortBy === "totalSales") {
      return { totalAmount: (sortOrder as "asc" | "desc") || "desc" };
    }
    return { createdAt: (sortOrder as "asc" | "desc") || "desc" };
  }

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
            averageValue: 0,
            date: booking.createdAt.toISOString().split("T")[0],
            details: {
              propertyId: propertyId,
              propertyName: propertyName,
            },
          });
        }

        const group = grouped.get(propertyId);
        group.totalSales += item.subTotal;
        group.totalBookings += 1;
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
      averageValue: booking.totalAmount,
      date: booking.createdAt.toISOString().split("T")[0],
      details: {
        bookingId: booking.id,
        bookingNo: booking.bookingNo,
        user: booking.user,
        items: booking.items,
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
          averageValue: 0,
          date: booking.createdAt.toISOString().split("T")[0],
          details: {
            userId: userId,
            userName: userName,
            userEmail: booking.user.email,
          },
        });
      }

      const group = grouped.get(userId);
      group.totalSales += booking.totalAmount;
      group.totalBookings += 1;
      group.averageValue = group.totalSales / group.totalBookings;
    });

    return Array.from(grouped.values());
  }

  private processPropertyReport(
    properties: any[],
    filters: PropertyReportRequest
  ) {
    const propertyReports = properties.map((property) => {
      const totalRooms = property.rooms.length;
      let availableRooms = 0;
      let bookedRooms = 0;
      let totalRevenue = 0;

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
        }
      });

      const occupancyRate =
        totalRooms > 0 ? (bookedRooms / totalRooms) * 100 : 0;

      return {
        propertyId: property.id,
        propertyName: property.name,
        totalRooms,
        availableRooms,
        bookedRooms,
        occupancyRate: Math.round(occupancyRate * 100) / 100,
        totalRevenue,
      };
    });

    const calendar = this.generateCalendarAvailability(properties, filters);

    return {
      properties: propertyReports,
      calendar,
    };
  }

  private generateCalendarAvailability(
    properties: any[],
    filters: PropertyReportRequest
  ) {
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
}
