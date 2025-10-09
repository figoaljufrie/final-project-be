import { start } from "repl";
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

  // Method for single-day lookups (used by Applier, kept for backward compatibility if needed)
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

  // Method to find all peak seasons active within a date range for a specific property (Used by PropertyService)
  public async findActivePeakSeasonsForPropertyRange(
    propertyId: number,
    startDate: Date,
    endDate: Date
  ): Promise<PeakSeason[]> {
    return prisma.peakSeason.findMany({
      where: {
        startDate: { lte: endDate },
        endDate: { gte: startDate },
        OR: [
          { applyToAllProperties: true },
          { propertyIds: { has: propertyId } },
        ],
      },
    });
  }

  // NEW/CORRECT: Method for public search - fetches ALL peak seasons active in the range (Used by PropertySearcher)
  public async findAllRelevantPeakSeasonsForRange(
    startDate: Date,
    endDate: Date
  ): Promise<PeakSeason[]> {
    return prisma.peakSeason.findMany({
      where: {
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
    propertyIds: number[] | undefined,
    applyToAllProperties: boolean,
    exludeId?: number
  ): Promise<boolean> {
    const s = new Date(startDate);
    s.setHours(0, 0, 0, 0);
    const e = new Date(endDate);
    e.setHours(0, 0, 0, 0);

    const dateOverlapClause = {
      tenantId: tenantId,
      startDate: { lte: e },
      endDate: { gte: s },
    } as any;

    const candidates = await prisma.peakSeason.findMany({
      where: {
        ...dateOverlapClause,
        ...(exludeId ? { id: { not: exludeId } } : {}),
      },
    });

    if (!candidates || candidates.length === 0) return false;
    if (applyToAllProperties) {
      return candidates.length > 0;
    }

    const incomingSet = new Set((propertyIds || []).map((p) => Number(p)));

    for (const cand of candidates) {
      if (cand.applyToAllProperties) {
        return true;
      }

      const candProps: number[] = (cand.propertyIds as number[]) || [];
      for (const p of candProps) {
        if (incomingSet.has(Number(p))) return true;
      }
    }
    return false;
  }

  public async findForPropertyInRange(
    propertyId: number,
    startDate: Date,
    endDate: Date
  ): Promise<PeakSeason[]> {
    return prisma.peakSeason.findMany({
      where: {
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
