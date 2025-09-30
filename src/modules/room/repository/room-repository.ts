import { Prisma, Room } from "../../../generated/prisma";
import { prisma } from "../../../shared/utils/prisma";

export class Roomrepository {
  public async create(data: Prisma.RoomCreateInput) {
    return prisma.room.create({
      data,
    });
  }

  public async createWithTx(
    tx: Prisma.TransactionClient,
    data: Prisma.RoomCreateInput
  ) {
    return tx.room.create({
      data,
    });
  }

  public async findByProperty(propertyId: number) {
    return prisma.room.findMany({
      where: { propertyId, deletedAt: null },
      include: { availability: true, images: true },
    });
  }

  public async findById(id: number) {
    return prisma.room.findFirst({
      where: { id, deletedAt: null },
      include: { availability: true, images: true },
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
