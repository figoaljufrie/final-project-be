import { RoomAvailability } from "../../../generated/prisma";
import { prisma } from "../../../shared/utils/prisma";

export class AvailabilityRepository {
  public async upsert(
    roomId: number,
    date: Date,
    data: Partial<any>
  ): Promise<RoomAvailability> {
    return prisma.roomAvailability.upsert({
      where: { roomId_date: { roomId, date } as any },
      update: {
        ...(typeof data.isAvailable === "boolean" && {
          isAvailable: { set: data.isAvailable },
        }),
        ...(typeof data.customPrice === "number" && {
          customPrice: { set: data.customPrice },
        }),
        ...(typeof data.priceModifier === "number" && {
          priceModifier: { set: data.priceModifier },
        }),
        ...(typeof data.reason === "string" && {
          reason: { set: data.reason },
        }),
      },
      create: {
        roomId,
        date,
        isAvailable:
          typeof data.isAvailable === "boolean" ? data.isAvailable : true,
        customPrice:
          typeof data.customPrice === "number" ? data.customPrice : null,
        priceModifier:
          typeof data.priceModifier === "number" ? data.priceModifier : null,
        reason: typeof data.reason === "string" ? data.reason : null,
      },
    });
  }

  public async findByRoomAndDate(roomId: number, date: Date) {
    return prisma.roomAvailability.findUnique({
      where: { roomId_date: { roomId, date } as any },
    });
  }

  public async findRange(roomId: number, from: Date, to: Date) {
    return prisma.roomAvailability.findMany({
      where: { roomId, date: { gte: from, lte: to } },
    });
  }

  public async delete(roomId: number, date: Date) {
    return prisma.roomAvailability.delete({
      where: { roomId_date: { roomId, date } as any },
    });
  }
}
