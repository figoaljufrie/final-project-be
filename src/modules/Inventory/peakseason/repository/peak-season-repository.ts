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

  /**
   * Checks if any existing peak seasons overlap with the given date range.
   * Instead of blocking, this now returns a list of overlapping seasons
   * so that the system can *stack* or *combine* them gracefully.
   */
  public async hasOverlapped(
    tenantId: number,
    startDate: Date,
    endDate: Date,
    propertyIds: number[] = [],
    applyToAllProperties: boolean,
    excludeId?: number
  ): Promise<PeakSeason[]> {
    const where: Prisma.PeakSeasonWhereInput = {
      tenantId,
      startDate: { lte: endDate },
      endDate: { gte: startDate },
    };

    if (excludeId) {
      where.id = { not: excludeId };
    }

    const overlappingSeasons = await prisma.peakSeason.findMany({ where });

    // Filter down to relevant overlaps (same property or global)
    const relevantOverlaps = overlappingSeasons.filter((season) => {
      if (applyToAllProperties || season.applyToAllProperties) return true;

      const commonProps = season.propertyIds.filter((id) =>
        propertyIds.includes(id)
      );
      return commonProps.length > 0;
    });

    return relevantOverlaps;
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

  public async deletePeakSeason(id: number): Promise<PeakSeason> {
    return prisma.peakSeason.delete({ where: { id } });
  }
}
