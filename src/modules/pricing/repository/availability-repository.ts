import { Prisma, RoomAvailability } from "../../../generated/prisma";
import { prisma } from "../../../shared/utils/prisma";
import { SetAvailabilityRepoData, AvailabilitySeedData } from "../dto/availability-dto";

export class AvailabilityRepository {
  private getUpsertData(data: SetAvailabilityRepoData) {
    return {
      update: {
        ...(typeof data.isAvailable === "boolean" && {
          isAvailable: data.isAvailable,
        }),
        ...(typeof data.customPrice === "number" && {
          customPrice: data.customPrice,
        }),
        ...(typeof data.priceModifier === "number" && {
          priceModifier: data.priceModifier,
        }),
        ...(typeof data.reason === "string" && {
          reason: data.reason,
        }),
      },
      create: {
        roomId: data.roomId,
        date: data.date,
        isAvailable: data.isAvailable ?? true,
        customPrice: data.customPrice ?? null,
        priceModifier: data.priceModifier ?? null,
        reason: data.reason ?? null,
      },
    };
  }

  public async upsert(data: SetAvailabilityRepoData): Promise<RoomAvailability> {
    return prisma.roomAvailability.upsert({
      where: { roomId_date: { roomId: data.roomId, date: data.date } } as any,
      ...this.getUpsertData(data),
    });
  }

  public async upsertWithTx(
    tx: Prisma.TransactionClient,
    data: SetAvailabilityRepoData
  ): Promise<RoomAvailability> {
    return tx.roomAvailability.upsert({
      where: { roomId_date: { roomId: data.roomId, date: data.date } } as any,
      ...this.getUpsertData(data),
    });
  }

  public async findByRoomAndDate(roomId: number, date: Date) {
    return prisma.roomAvailability.findUnique({
      where: { roomId_date: { roomId, date } } as any,
    });
  }

  public async findRange(roomId: number, from: Date, to: Date) {
    return prisma.roomAvailability.findMany({
      where: {
        roomId,
        date: {
          gte: from,
          lte: to,
        },
      },
    });
  }

  public async findBulkAvailability(roomIds: number[], from: Date, to: Date) {
    return prisma.roomAvailability.findMany({
      where: {
        roomId: { in: roomIds },
        date: {
          gte: from,
          lte: to,
        },
      },
    });
  }

  public deleteAvailability(roomId: number, date: Date) {
    return prisma.roomAvailability.delete({
      where: { roomId_date: { roomId, date } } as any,
    });
  }

  public async seedAvailabilityWithTx(
    roomId: number,
    totalUnits: number,
    tx: Prisma.TransactionClient
  ) {
    const records: AvailabilitySeedData[] = [];
    const dateCursor = new Date();
    dateCursor.setHours(0, 0, 0, 0);

    for (let i = 0; i < 365; i++) {
      records.push({
        roomId: roomId,
        date: new Date(dateCursor),
        isAvailable: true,
        availableUnits: totalUnits,
        bookedUnits: 0,
        customPrice: null,
      });
      dateCursor.setDate(dateCursor.getDate() + 1);
    }

    return tx.roomAvailability.createMany({ data: records as any });
  }
}