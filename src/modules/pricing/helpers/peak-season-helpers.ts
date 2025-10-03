import { Prisma } from "../../../generated/prisma";
import {
  RoomAvailabilityDto,
  PeakSeasonDto,
  RoomForPricing,
} from "../dto/availability-dto";
import {
  getDateRange,
  buildAvailabilityMap,
  calculateAvailabilityUpdate,
} from "./pricing-helpers";
import { PropertyRepository } from "../../property/repository/property-repository";
import { RoomRepository } from "../../room/repository/room-repository";
import { AvailabilityRepository } from "../repository/availability-repository";
import { PeakSeasonRepository } from "../repository/peak-season-repository";
import { prisma } from "../../../shared/utils/prisma";

export class PeakSeasonAvailabilityApplier {
  private propertyRepository: PropertyRepository;
  private roomRepository: RoomRepository;
  private availabilityRepository: AvailabilityRepository;
  private peakSeasonRepository: PeakSeasonRepository;

  constructor(
    propertyRepository: PropertyRepository,
    roomRepository: RoomRepository,
    availabilityRepository: AvailabilityRepository,
    peakSeasonRepository: PeakSeasonRepository
  ) {
    this.propertyRepository = propertyRepository;
    this.roomRepository = roomRepository;
    this.availabilityRepository = availabilityRepository;
    this.peakSeasonRepository = peakSeasonRepository;
  }

  public async applyChanges(
    peakSeason: PeakSeasonDto,
    oldPeakSeason?: PeakSeasonDto,
    isDelete: boolean = false
  ) {
    const [newPropertyIds, oldPropertyIds] = await Promise.all([
      this.getPropertyIdsForPeakSeason(peakSeason),
      oldPeakSeason
        ? this.getPropertyIdsForPeakSeason(oldPeakSeason)
        : Promise.resolve([]),
    ]);

    const affectedPropertyIds = [
      ...new Set([...newPropertyIds, ...oldPropertyIds]),
    ];

    if (affectedPropertyIds.length === 0) return;

    const { rangeStart, rangeEnd } = this.getAffectedDateRange(
      peakSeason,
      oldPeakSeason
    );

    const rooms: RoomForPricing[] =
      await this.roomRepository.findRoomsByPropertyIds(affectedPropertyIds);

    const allAvailability =
      await this.availabilityRepository.findBulkAvailability(
        rooms.map((r) => r.id),
        rangeStart,
        rangeEnd
      );

    const psMap = buildAvailabilityMap(
      allAvailability as RoomAvailabilityDto[]
    );

    // FIX N+1: Fetch ALL relevant peak seasons for THIS TENANT in ONE query.
    const RelevantPeakSeasons =
      await this.peakSeasonRepository.findRelevantPeakSeasonsForTenantRange(
        peakSeason.tenantId, // <-- Crucially scoped to the current tenant
        rangeStart,
        rangeEnd
      );

    const upsertOperations = await this.createAvailabilityUpsertOperations(
      rooms,
      rangeStart,
      rangeEnd,
      peakSeason,
      psMap,
      isDelete,
      RelevantPeakSeasons as PeakSeasonDto[]
    );

    if (upsertOperations.length > 0) {
      await prisma.$transaction(upsertOperations);
    }
  }

  private async getPropertyIdsForPeakSeason(
    ps: PeakSeasonDto
  ): Promise<number[]> {
    if (ps.applyToAllProperties) {
      const props = await this.propertyRepository.findByTenant(ps.tenantId);
      return props.map((p) => p.id);
    }
    return (ps.propertyIds as number[]) || [];
  }

  private getAffectedDateRange(
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

  private createAvailabilityUpsertOperations(
    rooms: RoomForPricing[],
    rangeStart: Date,
    rangeEnd: Date,
    peakSeason: PeakSeasonDto,
    psMap: Map<string, RoomAvailabilityDto>,
    isDelete: boolean,
    allRelevantPeakSeasons: PeakSeasonDto[]
  ): Prisma.PrismaPromise<any>[] {
    const dateRange = getDateRange(rangeStart, rangeEnd, true);
    const upsertOperations: Prisma.PrismaPromise<any>[] = [];

    for (const room of rooms) {
      for (const date of dateRange) {
        const dateKey = date.toISOString().split("T")[0];
        const existingAvail = psMap.get(`${room.id}-${dateKey}`) ?? null;

        let finalActivePeakSeasons = allRelevantPeakSeasons.filter((ps) => {
          const isActive = date >= ps.startDate && date <= ps.endDate;
          const appliesToProperty =
            ps.applyToAllProperties || ps.propertyIds.includes(room.propertyId);
          return isActive && appliesToProperty;
        });

        finalActivePeakSeasons = finalActivePeakSeasons.filter(
          (ps) => ps.id !== peakSeason.id
        );

        if (!isDelete) {
          finalActivePeakSeasons.push(peakSeason);
        }

        const { customPrice, reason } = calculateAvailabilityUpdate(
          room.basePrice,
          existingAvail,
          finalActivePeakSeasons
        );

        upsertOperations.push(
          prisma.roomAvailability.upsert({
            where: {
              roomId_date: { roomId: room.id, date: date },
            } as { roomId_date: { roomId: number; date: Date } },
            update: {
              customPrice: customPrice,
              reason: reason,
            },
            create: {
              roomId: room.id,
              date: date,
              customPrice: customPrice,
              isAvailable: true,
              bookedUnits: 0,
              reason: reason,
            },
          })
        );
      }
    }
    return upsertOperations;
  }
}