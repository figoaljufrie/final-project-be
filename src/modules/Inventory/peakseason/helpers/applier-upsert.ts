import { Prisma } from "@/generated/prisma";
import { prisma } from "@/shared/utils/prisma";
import {
  RoomAvailabilityDto,
  RoomForPricing,
} from "../../availability/dto/availability-dto";
import {
  calculateAvailabilityUpdate,
  getAvailabilityDateRange,
} from "../../availability/helpers/availability-helpers";
import { PeakSeasonDto } from "../dto/peak-season-dto";
import { formatDateKey, toLocalMidnight } from "@/shared/helpers/date-utils";

export class PeakSeasonApplierUpsert {
  public createAvailabilityUpsertOperations(
    rooms: RoomForPricing[],
    rangeStart: Date,
    rangeEnd: Date,
    peakSeason: PeakSeasonDto,
    psMap: Map<string, RoomAvailabilityDto>,
    isDelete: boolean,
    allRelevantPeakSeasons: PeakSeasonDto[]
  ): Prisma.PrismaPromise<any>[] {
    const dateRange = getAvailabilityDateRange(rangeStart, rangeEnd, true);
    const upsertOperations: Prisma.PrismaPromise<any>[] = [];

    for (const room of rooms) {
      for (const date of dateRange) {
        const normalizedDate = toLocalMidnight(date);
        const dateKey = formatDateKey(normalizedDate);

        const existingAvail = psMap.get(`${room.id}-${dateKey}`) ?? null;

        let finalActivePeakSeasons = allRelevantPeakSeasons.filter((ps) => {
          const isActive =
            normalizedDate >= toLocalMidnight(ps.startDate) &&
            normalizedDate <= toLocalMidnight(ps.endDate);
          const appliesToProperty =
            ps.applyToAllProperties || ps.propertyIds.includes(room.propertyId);
          return isActive && appliesToProperty;
        });

        // ✅ STEP 2: Handle create/update/delete
        if (isDelete) {
          // Remove the deleted peak season from the list
          finalActivePeakSeasons = finalActivePeakSeasons.filter(
            (ps) => ps.id !== peakSeason.id
          );
        } else {
          finalActivePeakSeasons = finalActivePeakSeasons.filter(
            (ps) => ps.id !== peakSeason.id
          );
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
              roomId_date: { roomId: room.id, date: normalizedDate },
            } as { roomId_date: { roomId: number; date: Date } },
            update: {
              customPrice,
              reason,
            },
            create: {
              roomId: room.id,
              date: normalizedDate,
              customPrice,
              isAvailable: true,
              bookedUnits: 0,
              totalUnits: room.totalUnits ?? 1,
              reason,
            },
          })
        );
      }
    }

    return upsertOperations;
  }
}
