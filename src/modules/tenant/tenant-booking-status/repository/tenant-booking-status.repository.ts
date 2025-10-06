import { prisma } from "../../../../shared/utils/prisma";
import { BookingStatus } from "../../../../generated/prisma";
import { TenantBookingFilter } from "../dto/tenant-booking-status.dto";
import { BookingUtils } from "../../../../shared/utils/booking-utils";

export class TenantBookingRepository {
  
  // Get tenant bookings with filters and pagination
  async getTenantBookings(filters: TenantBookingFilter) {
    const {
      tenantId,
      status,
      bookingNo,
      startDate,
      endDate,
      page = 1,
      limit = 10,
    } = filters;

    const skip = (Number(page) - 1) * Number(limit);
    const where: any = {};

    // Filter by tenant's properties
    where.items = {
      some: {
        room: {
          property: {
            tenantId: tenantId
          }
        }
      }
    };

    if (status) where.status = status;
    if (bookingNo) {
      where.bookingNo = {
        contains: bookingNo,
        mode: "insensitive",
      };
    }
    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true,
            },
          },
          items: {
            include: {
              room: {
                include: {
                  property: {
                    select: {
                      id: true,
                      name: true,
                      address: true,
                      city: true,
                      tenantId: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: Number(limit),
      }),
      prisma.booking.count({ where }),
    ]);

    return { bookings, total };
  }

  // Find booking by ID for tenant
  async findTenantBooking(bookingId: number, tenantId: number) {
    return await prisma.booking.findFirst({
      where: {
        id: bookingId,
        items: {
          some: {
            room: {
              property: {
                tenantId: tenantId
              }
            }
          }
        }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        items: {
          include: {
            room: {
              include: {
                property: {
                  include: {
                    tenant: {
                      select: {
                        id: true,
                        name: true,
                        email: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  // Confirm payment with room availability update
  async confirmPayment(bookingId: number) {
    return await prisma.$transaction(async (tx) => {
      // Get booking details first
      const booking = await tx.booking.findUnique({
        where: { id: bookingId },
        include: {
          items: {
            include: {
              room: true,
            },
          },
        },
      });

      if (!booking) {
        throw new Error('Booking not found');
      }

      // Update booking status
      const confirmedBooking = await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: BookingStatus.confirmed,
          confirmedAt: new Date(),
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true,
            },
          },
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
      });

      // Update room availability for each date in booking range
      const dates = this.getDateRange(booking.checkIn, booking.checkOut);
      
      for (const item of booking.items) {
        for (const date of dates) {
          await tx.roomAvailability.upsert({
            where: {
              roomId_date: {
                roomId: item.roomId,
                date: date,
              },
            },
            update: {
              bookedUnits: {
                increment: item.unitCount,
              },
            },
            create: {
              roomId: item.roomId,
              date: date,
              isAvailable: true,
              bookedUnits: item.unitCount,
            },
          });
        }
      }

      return confirmedBooking;
    });
  }

  // Helper method to get date range
  private getDateRange(checkIn: Date, checkOut: Date): Date[] {
    const dates: Date[] = [];
    const currentDate = new Date(checkIn);
    const endDate = new Date(checkOut);

    while (currentDate < endDate) {
      dates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return dates;
  }

  // Reject payment
  async rejectPayment(bookingId: number, rejectionReason: string) {
    return await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: BookingStatus.waiting_for_payment,
        cancelReason: rejectionReason,
        cancelledAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
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
    });
  }

  // Cancel user order
  async cancelUserOrder(bookingId: number, cancelReason: string) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        items: {
          include: {
            room: true,
          },
        },
      },
    });

    if (!booking) {
      throw new Error('Booking not found');
    }

    return await prisma.$transaction(async (tx) => {
      // Update booking status
      const cancelledBooking = await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: BookingStatus.cancelled,
          cancelReason,
          cancelledAt: new Date(),
        },
      });

      // Release room availability
      for (const item of booking.items) {
        const dates = BookingUtils.getDateRange(booking.checkIn, booking.checkOut);
        
        for (const date of dates) {
          await tx.roomAvailability.updateMany({
            where: {
              roomId: item.roomId,
              date,
            },
            data: {
              bookedUnits: {
                decrement: item.unitCount,
              },
            },
          });
        }
      }

      return cancelledBooking;
    });
  }

  // Get pending confirmations count
  async getPendingConfirmationsCount(tenantId: number) {
    return await prisma.booking.count({
      where: {
        status: BookingStatus.waiting_for_confirmation,
        items: {
          some: {
            room: {
              property: {
                tenantId: tenantId
              }
            }
          }
        }
      },
    });
  }
}