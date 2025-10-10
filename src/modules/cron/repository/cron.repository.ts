import { prisma } from "../../../shared/utils/prisma";
import { BookingStatus } from "../../../generated/prisma";

export class CronRepository {
  // Get expired bookings for auto-cancel (Feature 2: 2 hours for all payment methods)
  async getExpiredBookings() {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    
    return await prisma.booking.findMany({
      where: {
        status: BookingStatus.waiting_for_payment,
        paymentDeadline: { lt: twoHoursAgo }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
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

  // Get booking for auto-cancel by ID
  async getBookingForAutoCancel(bookingId: number) {
    return await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
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

  // Get booking by ID
  async getBookingById(bookingId: number) {
    return await prisma.booking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        bookingNo: true,
        status: true,
        checkOut: true,
      },
    });
  }

  // Complete booking after checkout
  async completeBooking(bookingId: number) {
    return await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: BookingStatus.completed,
        completedAt: new Date(),
      },
    });
  }

  // Get booking for check-in reminder by ID
  async getBookingForCheckInReminder(bookingId: number) {
    return await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
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

  // Auto-cancel booking with transaction
  async autoCancelBooking(bookingId: number, dates: Date[], roomId: number, unitCount: number) {
    return await prisma.$transaction(async (tx) => {
      // Update booking status
      const updatedBooking = await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: BookingStatus.cancelled,
          cancelledAt: new Date(),
          cancelReason: "Payment deadline expired - Auto cancelled",
        },
      });

      // Release room availability
      for (const date of dates) {
        await tx.roomAvailability.updateMany({
          where: {
            roomId: roomId,
            date: date,
          },
          data: {
            bookedUnits: {
              decrement: unitCount,
            },
          },
        });
      }

      return updatedBooking;
    });
  }
}
