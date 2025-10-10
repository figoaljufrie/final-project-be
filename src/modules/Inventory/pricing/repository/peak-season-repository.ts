import { PeakSeason, Prisma } from "../../../../generated/prisma";
import { prisma } from "../../../../shared/utils/prisma";

export class PeakSeasonRepository {
  public async createPeakSeason(
    data: Prisma.PeakSeasonCreateInput
  ): Promise<PeakSeason> {
    return prisma.peakSeason.create({ data });
  }

  public async findPeakSeasonByTenant(tenantId: number): Promise<PeakSeason[]> {
    return prisma.peakSeason.findMany({
      where: { tenantId },
      orderBy: { startDate: "desc" },
    });
  }

  public async updatePeakSeason(
    id: number,
    data: Partial<Prisma.PeakSeasonUpdateInput>
  ): Promise<PeakSeason> {
    return prisma.peakSeason.update({ where: { id }, data: data as any });
  }

  public async findExistingPeakSeasonForUpdate(
    id: number,
    tenantId: number
  ): Promise<PeakSeason | null> {
    return prisma.peakSeason.findFirst({
      where: { id, tenantId },
    });
  }

  public async findActivePeakSeasonsForProperty(
    propertyId: number,
    date: Date
  ): Promise<PeakSeason[]> {
    return prisma.peakSeason.findMany({
      where: {
        startDate: { lte: date },
        endDate: { gte: date },
        OR: [
          { applyToAllProperties: true },
          { propertyIds: { has: propertyId } },
        ],
      },
    });
  }
  public async findActivePeakSeasonsForPropertyRange(
    propertyId: number,
    startDate: Date,
    endDate: Date,
    tenantId?: number
  ): Promise<PeakSeason[]> {
    return prisma.peakSeason.findMany({
      where: {
        ...(tenantId ? { tenantId } : {}),
        startDate: { lte: endDate },
        endDate: { gte: startDate },
        OR: [
          { applyToAllProperties: true },
          { propertyIds: { has: propertyId } },
        ],
      },
    });
  }

  public async findAllRelevantPeakSeasonsForRange(
    startDate: Date,
    endDate: Date,
    tenantId?: number
  ): Promise<PeakSeason[]> {
    return prisma.peakSeason.findMany({
      where: {
        ...(tenantId ? { tenantId } : {}),
        startDate: { lte: endDate },
        endDate: { gte: startDate },
      },
    });
  }

  public async findRelevantPeakSeasonsForTenantRange(
    tenantId: number,
    startDate: Date,
    endDate: Date
  ): Promise<PeakSeason[]> {
    return prisma.peakSeason.findMany({
      where: {
        tenantId: tenantId,
        startDate: { lte: endDate },
        endDate: { gte: startDate },
      },
    });
  }

  public async hasOverlapped(
    tenantId: number,
    startDate: Date,
    endDate: Date,
    propertyIds: number[] = [],
    applyToAllProperties: boolean,
    excludeId?: number
  ): Promise<boolean> {
    // Build a clean where clause dynamically
    const where: Prisma.PeakSeasonWhereInput = {
      tenantId,
      OR: [
        {
          startDate: { lte: endDate },
          endDate: { gte: startDate },
        },
      ],
    };

    if (excludeId) {
      where.id = { not: excludeId };
    }

    const overlappingSeasons = await prisma.peakSeason.findMany({ where });

    for (const season of overlappingSeasons) {
      if (applyToAllProperties || season.applyToAllProperties) {
        return true;
      }

      const commonProps = season.propertyIds.filter((id) =>
        propertyIds.includes(id)
      );
      if (commonProps.length > 0) {
        return true;
      }
    }

    return false;
  }

  public async findForPropertyInRange(
    propertyId: number,
    startDate: Date,
    endDate: Date,
    tenantId?: number
  ): Promise<PeakSeason[]> {
    return prisma.peakSeason.findMany({
      where: {
        ...(tenantId ? { tenantId } : {}),
        startDate: { lte: endDate },
        endDate: { gte: startDate },
        OR: [
          { applyToAllProperties: true },
          { propertyIds: { has: propertyId } },
        ],
      },
      orderBy: { startDate: "asc" },
    });
  }
}
