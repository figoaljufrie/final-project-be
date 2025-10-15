import { PropertyRepository } from "../../property/repository/property-repository";
import { PeakSeasonDto } from "../dto/peak-season-dto";

export class PeakSeasonApplierUtils {
  private propertyRepository: PropertyRepository;

  constructor(propertyRepository: PropertyRepository) {
    this.propertyRepository = propertyRepository;
  }

  public async getPropertyIdsForPeakSeason(
    ps: PeakSeasonDto
  ): Promise<number[]> {
    if (ps.applyToAllProperties) {
      const props = await this.propertyRepository.findByTenant(ps.tenantId);
      return props.map((p) => p.id);
    }
    return (ps.propertyIds as number[]) || [];
  }

  public getAffectedDateRange(
    peakSeason: PeakSeasonDto,
    oldPeakSeason?: PeakSeasonDto
  ): { rangeStart: Date; rangeEnd: Date } {
    const rangeStart = oldPeakSeason
      ? new Date(
          Math.min(
            peakSeason.startDate.getTime(),
            oldPeakSeason.startDate.getTime()
          )
        )
      : peakSeason.startDate;

    const rangeEnd = oldPeakSeason
      ? new Date(
          Math.max(
            peakSeason.endDate.getTime(),
            oldPeakSeason.endDate.getTime()
          )
        )
      : peakSeason.endDate;

    return { rangeStart, rangeEnd };
  }
}
