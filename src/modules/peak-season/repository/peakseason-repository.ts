import { Prisma } from "../../../generated/prisma";
import { prisma } from "../../../shared/utils/prisma";

export class PeakSeasonRepository {
  public async create(data: Prisma.PeakSeasonCreateInput) {
    return prisma.peakSeason.create({
      data,
    });
  }

  public async findById(id: number) {
    return prisma.peakSeason.findUnique({ where: { id } });
  }

  public async findByTenant(tenantId: number) {
    return prisma.peakSeason.findMany({ where: { tenantId } });
  }

  public async update(id: number, data: Partial<Prisma.PeakSeasonUpdateInput>) {
    return prisma.peakSeason.update({
      where: { id },
      data,
    });
  }

  public async delete(id: number) {
    return prisma.peakSeason.delete({
      where: { id },
    });
  }

  public async findActiveForPropertyDate(propertyId: number, date: Date) {
    return prisma.peakSeason.findMany({
      where: {
        startDate: { lte: date },
        endDate: { gte: date },
        OR: [
          {
            applyToAllProperties: true,
          },
          {
            propertyIds: { has: propertyId },
          },
        ],
      },
    });
  }
}
