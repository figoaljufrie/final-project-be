import { Prisma, RoomAvailability } from "../../../../generated/prisma";
import { prisma } from "../../../../shared/utils/prisma";
import {
  AvailabilitySeedDto,
  SetAvailabilityRepoDto,
} from "../dto/availability-dto";

export class AvailabilityRepository {
  private getUpsertData(data: SetAvailabilityRepoDto, totalUnits?: number) {
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
        ...(typeof data.bookedUnits === "number" && {
          bookedUnits: data.bookedUnits,
        }),
        ...(totalUnits && { totalUnits }),
      },
      create: {
        roomId: data.roomId,
        date: data.date,
        isAvailable: data.isAvailable ?? true,
        customPrice: data.customPrice ?? null,
        priceModifier: data.priceModifier ?? null,
        reason: data.reason ?? null,
        bookedUnits: data.bookedUnits ?? 0,
        totalUnits: totalUnits ?? 1,
      },
    };
  }

  public async upsert(
    data: SetAvailabilityRepoDto,
    totalUnits?: number
  ): Promise<RoomAvailability> {
    return prisma.roomAvailability.upsert({
      where: { roomId_date: { roomId: data.roomId, date: data.date } } as any,
      ...this.getUpsertData(data, totalUnits),
    });
  }

  public async upsertWithTx(
    tx: Prisma.TransactionClient,
    data: SetAvailabilityRepoDto,
    totalUnits?: number
  ): Promise<RoomAvailability> {
    return tx.roomAvailability.upsert({
      where: { roomId_date: { roomId: data.roomId, date: data.date } } as any,
      ...this.getUpsertData(data, totalUnits),
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

  // Seed method now stores totalUnits
  public async seedAvailabilityWithTx(
    roomId: number,
    totalUnits: number,
    tx: Prisma.TransactionClient
  ) {
    const records: AvailabilitySeedDto[] = [];
    const dateCursor = new Date();
    dateCursor.setHours(0, 0, 0, 0);

    for (let i = 0; i < 365; i++) {
      records.push({
        roomId: roomId,
        date: new Date(dateCursor),
        isAvailable: true,
        bookedUnits: 0,
        totalUnits,
        customPrice: null,
      });
      dateCursor.setDate(dateCursor.getDate() + 1);
    }

    return tx.roomAvailability.createMany({ data: records as any });
  }
}
