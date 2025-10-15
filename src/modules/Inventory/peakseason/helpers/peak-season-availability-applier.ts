import { buildAvailabilityMap } from "@/shared/helpers/build-availability-map";
import { prisma } from "@/shared/utils/prisma";
import {
  RoomAvailabilityDto,
  RoomForPricing,
} from "../../availability/dto/availability-dto";
import { AvailabilityRepository } from "../../availability/repository/availability-repository";
import { PropertyRepository } from "../../property/repository/property-repository";
import { RoomRepository } from "../../room/repository/room-repository";
import { PeakSeasonDto } from "../dto/peak-season-dto";
import { PeakSeasonRepository } from "../repository/peak-season-repository";
import { PeakSeasonApplierCore } from "./applier-core";
import { PeakSeasonApplierUpsert } from "./applier-upsert";
import { PeakSeasonApplierUtils } from "./applier-utils";
import { toLocalMidnight } from "@/shared/helpers/date-utils";

export class PeakSeasonAvailabilityApplier extends PeakSeasonApplierCore {
  private utils: PeakSeasonApplierUtils;
  private upsertHelper: PeakSeasonApplierUpsert;

  constructor(
    propertyRepository: PropertyRepository,
    roomRepository: RoomRepository,
    availabilityRepository: AvailabilityRepository,
    peakSeasonRepository: PeakSeasonRepository
  ) {
    super(
      propertyRepository,
      roomRepository,
      availabilityRepository,
      peakSeasonRepository
    );

    this.utils = new PeakSeasonApplierUtils(propertyRepository);
    this.upsertHelper = new PeakSeasonApplierUpsert();
  }

  public async applyChanges(
    peakSeason: PeakSeasonDto,
    oldPeakSeason?: PeakSeasonDto,
    isDelete: boolean = false
  ) {
    const [newPropertyIds, oldPropertyIds] = await Promise.all([
      this.utils.getPropertyIdsForPeakSeason(peakSeason),
      oldPeakSeason
        ? this.utils.getPropertyIdsForPeakSeason(oldPeakSeason)
        : Promise.resolve([]),
    ]);

    const affectedPropertyIds = [
      ...new Set([...newPropertyIds, ...oldPropertyIds]),
    ];

    if (affectedPropertyIds.length === 0) return;

    const { rangeStart, rangeEnd } = this.utils.getAffectedDateRange(
      peakSeason,
      oldPeakSeason
    );

    const normalizedStart = toLocalMidnight(rangeStart);
    const normalizedEnd = toLocalMidnight(rangeEnd);

    const rooms: RoomForPricing[] =
      await this.roomRepository.findRoomsByPropertyIds(affectedPropertyIds);

    const allAvailability =
      await this.availabilityRepository.findBulkAvailability(
        rooms.map((r) => r.id),
        normalizedStart,
        normalizedEnd
      );

    const psMap = buildAvailabilityMap(
      allAvailability as RoomAvailabilityDto[]
    );

    const RelevantPeakSeasons =
      await this.peakSeasonRepository.findRelevantPeakSeasonsForTenantRange(
        peakSeason.tenantId,
        normalizedStart,
        normalizedEnd
      );

    const upsertOperations =
      this.upsertHelper.createAvailabilityUpsertOperations(
        rooms,
        normalizedStart,
        normalizedEnd,
        peakSeason,
        psMap,
        isDelete,
        RelevantPeakSeasons as PeakSeasonDto[]
      );

    if (upsertOperations.length > 0) {
      await prisma.$transaction(upsertOperations);
    }
  }
}
