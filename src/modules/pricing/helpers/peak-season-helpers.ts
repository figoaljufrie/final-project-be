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
  private roomRepository: any; // Using 'any' to match the service's current usage
  private availabilityRepository: AvailabilityRepository;
  private peakSeasonRepository: PeakSeasonRepository;

  constructor(
    propertyRepository: PropertyRepository,
    roomRepository: any,
    availabilityRepository: AvailabilityRepository,
    peakSeasonRepository: PeakSeasonRepository
  ) {
    this.propertyRepository = propertyRepository;
    this.roomRepository = roomRepository;
    this.availabilityRepository = availabilityRepository;
    this.peakSeasonRepository = peakSeasonRepository;
  }

  // Orchestrates the room availability update process
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

    const upsertOperations = await this.createAvailabilityUpsertOperations(
      rooms,
      rangeStart,
      rangeEnd,
      peakSeason,
      psMap,
      isDelete
    );

    if (upsertOperations.length > 0) {
      await prisma.$transaction(upsertOperations);
    }
  }

  // Resolves all affected Property IDs for a Peak Season
  private async getPropertyIdsForPeakSeason(ps: PeakSeasonDto): Promise<number[]> {
    if (ps.applyToAllProperties) {
      const props = await this.propertyRepository.findByTenant(ps.tenantId);
      return props.map((p: any) => p.id);
    }
    return (ps.propertyIds as number[]) || [];
  }

  // Calculates the combined date range for updates/deletes
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
  
  // Creates the list of Prisma upsert operations
  private async createAvailabilityUpsertOperations(
    rooms: RoomForPricing[],
    rangeStart: Date,
    rangeEnd: Date,
    peakSeason: PeakSeasonDto,
    psMap: Map<string, RoomAvailabilityDto>,
    isDelete: boolean
  ): Promise<Prisma.PrismaPromise<any>[]> {
    const dateRange = getDateRange(rangeStart, rangeEnd, true);
    const upsertOperations: Prisma.PrismaPromise<any>[] = [];

    for (const room of rooms) {
      for (const date of dateRange) {
        const dateKey = date.toISOString().split("T")[0];
        const existingAvail = psMap.get(`${room.id}-${dateKey}`) ?? null;

        let finalActivePeakSeasons =
          await this.peakSeasonRepository.findActivePeakSeasonsForProperty(
            room.propertyId,
            date
          );

        finalActivePeakSeasons = finalActivePeakSeasons.filter(
          (ps) => ps.id !== peakSeason.id
        );

        if (!isDelete) {
          finalActivePeakSeasons.push(peakSeason);
        }

        const { customPrice, reason } = calculateAvailabilityUpdate(
          room.basePrice,
          existingAvail as RoomAvailabilityDto,
          finalActivePeakSeasons
        );

        upsertOperations.push(
          prisma.roomAvailability.upsert({
            where: {
              roomId_date: { roomId: room.id, date: date },
            },
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