import { Prisma, Room } from "../../../../generated/prisma";
import { prisma } from "../../../../shared/utils/prisma";
import { RoomCreateTxDto } from "../dto/room-dto";

export class RoomRepository {
  public async findRoomsByPropertyIds(propertyIds: number[]) {
    return prisma.room.findMany({
      where: {
        propertyId: { in: propertyIds },
        deletedAt: null,
      },
    });
  }

  public async createWithTx(
    data: RoomCreateTxDto,
    tx: Prisma.TransactionClient
  ): Promise<Room> {
    const totalUnits = data.totalUnits ?? 1;
    return tx.room.create({
      data: {
        propertyId: data.propertyId,
        name: data.name,
        capacity: data.capacity,
        basePrice: data.basePrice,
        description: data.description ?? null,
        totalUnits: totalUnits,
      },
    });
  }

  public async findByProperty(propertyId: number) {
    return prisma.room.findMany({
      where: { propertyId, deletedAt: null },
      include: { images: true },
    });
  }

  public async findById(id: number) {
    return prisma.room.findFirst({
      where: { id, deletedAt: null },
      include: { availability: true, images: true },
    });
  }

  public async findPropertyId(id: number) {
    return prisma.room.findFirst({
      where: { id, deletedAt: null },
      select: { propertyId: true },
    });
  }

  public async update(id: number, data: Partial<Prisma.RoomUpdateInput>) {
    return prisma.room.update({ where: { id }, data });
  }

  public async softDelete(id: number) {
    return prisma.room.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
