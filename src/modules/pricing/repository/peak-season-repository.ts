import { PeakSeason, Prisma } from "../../../generated/prisma";
import { prisma } from "../../../shared/utils/prisma";

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
}
