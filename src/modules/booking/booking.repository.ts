import { prisma } from "../../shared/utils/prisma";
import { BookingStatus } from "../../generated/prisma";
import { BookingFilter } from "../../shared/types/booking.types";

export class BookingRepository {
  // Create new booking
  async createBooking(data: any) {
    return await prisma.booking.create({
      data,
      include: {
        items: {
          include: {
            room: {
              include: {
                property: {
                  include: {
                    images: {
                      where: { isPrimary: true },
                      take: 1,
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

  // Find booking by ID (untuk tenant/admin view)
  async findBookingById(id: number) {
    return await prisma.booking.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            room: {
              include: {
                property: {
                  include: {
                    images: true,
                    tenant: {
                      select: {
                        id: true,
                        name: true,
                        email: true,
                      },
                    },
                  },
                },
                images: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        reviews: true,
      },
    });
  }

  // Find booking by ID and user ID (untuk user view)
  async findUserBooking(bookingId: number, userId: number) {
    return await prisma.booking.findFirst({
      where: {
        id: bookingId,
        userId,
      },
      include: {
        items: {
          include: {
            room: {
              include: {
                property: {
                  include: {
                    images: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  // Get user bookings with filters and pagination
  async getUserBookings(filters: BookingFilter) {
    const {
      userId,
      status,
      bookingNo,
      startDate,
      endDate,
      page = 1,
      limit = 10,
    } = filters;

    const skip = (Number(page) - 1) * Number(limit);
    const where: any = { userId };

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
          items: {
            include: {
              room: {
                include: {
                  property: {
                    include: {
                      images: {
                        where: { isPrimary: true },
                        take: 1,
                      },
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

  // Update booking
  async updateBooking(id: number, data: any) {
    return await prisma.booking.update({
      where: { id },
      data,
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
    });
  }

  // Find room with availability
  async findRoomWithAvailability(
    roomId: number,
    checkInDate: Date,
    checkOutDate: Date
  ) {
    return await prisma.room.findFirst({
      where: {
        id: roomId,
        deletedAt: null,
        property: {
          published: true,
          deletedAt: null,
        },
      },
      include: {
        property: true,
        availability: {
          where: {
            date: {
              gte: checkInDate,
              lt: checkOutDate,
            },
          },
        },
      },
    });
  }

  // Create booking with transaction (ATOMIC)
  async createBookingWithTransaction(
    bookingData: any,
    dates: Date[],
    roomId: number,
    unitCount: number
  ) {
    return await prisma.$transaction(async (tx) => {
      // Create booking
      const booking = await tx.booking.create({
        data: bookingData,
        include: {
          items: {
            include: {
              room: {
                include: {
                  property: {
                    include: {
                      images: {
                        where: { isPrimary: true },
                        take: 1,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });

      // Update room availability for each date
      for (const date of dates) {
        await tx.roomAvailability.upsert({
          where: {
            roomId_date: {
              roomId,
              date,
            },
          },
          update: {
            bookedUnits: {
              increment: unitCount,
            },
          },
          create: {
            roomId,
            date,
            isAvailable: true,
            bookedUnits: unitCount,
          },
        });
      }

      return booking;
    });
  }

  // Cancel booking with transaction (ATOMIC)
  async cancelBookingWithTransaction(
    bookingId: number,
    cancelReason: string,
    items: any[],
    dates: Date[]
  ) {
    return await prisma.$transaction(async (tx) => {
      // 1. Update booking status
      const cancelledBooking = await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: BookingStatus.cancelled,
          cancelReason,
          cancelledAt: new Date(),
        },
      });

      // 2. Release room availability
      for (const item of items) {
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
}