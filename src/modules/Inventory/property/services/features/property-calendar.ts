import { PeakSeasonDto } from "@/modules/Inventory/peakseason/dto/peak-season-dto";
import { PeakSeasonQuery } from "@/modules/Inventory/peakseason/services/features/peak-season-query";
import { buildAvailabilityMap } from "@/shared/helpers/build-availability-map";
import { RoomAvailability as PrismaRoomAvailability } from "../../../../../generated/prisma";
import { CacheKeys } from "../../../../../shared/helpers/cache-keys";
import { ApiError } from "../../../../../shared/utils/api-error";
import { cacheManager } from "../../../../../shared/utils/redis/cache-manager";
import { cacheConfig } from "../../../../../shared/utils/redis/redis-config";
import { AvailabilityService } from "../../../availability/services/availability-service";
import { getPropertyDateRange } from "../../helpers/property-helpers";
import { PropertyRepository } from "../../repository/property-repository";
import { toLocalMidnight, formatDateKey } from "@/shared/helpers/date-utils";

type RoomAvailabilityType = PrismaRoomAvailability;

export class PropertyCalendarService {
  private propertyRepository = new PropertyRepository();
  private availabilityService = new AvailabilityService();
  private peakSeasonQuery = new PeakSeasonQuery();

  public async getPropertyCalendar(
    propertyId: number,
    month: number,
    year: number
  ) {
    const cacheKey = CacheKeys.propertyCalendar(propertyId, month, year);
    return cacheManager.getOrSet(
      cacheKey,
      async () => {
        console.log("⚙️ Generating property calendar from database...");
        return await this.generatePropertyCalendar(propertyId, month, year);
      },
      cacheConfig.calendarTTL
    );
  }

  private async generatePropertyCalendar(
    propertyId: number,
    month: number,
    year: number
  ) {
    const property = await this.propertyRepository.findByIdWithRooms(
      propertyId
    );
    if (!property) throw new ApiError("Property not found", 404);

    // Normalize month range to local midnight
    const startDate = toLocalMidnight(new Date(year, month - 1, 1));
    const endDate = toLocalMidnight(new Date(year, month, 0));
    const roomIds = property.rooms.map((r) => r.id);
    const dateRange = getPropertyDateRange(startDate, endDate, true);

    const [peakSeasons, availabilityData] = await Promise.all([
      this.peakSeasonQuery.findActivePeakSeasonsForProperty(
        propertyId,
        startDate,
        endDate
      ),
      this.availabilityService.getBulkAvailabilityForRooms(
        roomIds,
        startDate,
        endDate
      ),
    ]);

    const availMap = buildAvailabilityMap(availabilityData);

    const calendarData = property.rooms.map((room) => {
      const dailyPrices = dateRange.map((date) => {
        const localDate = toLocalMidnight(date);
        const dateKey = formatDateKey(localDate);

        let availabilityFallback =
          availMap.get(`${room.id}-${dateKey}`) ?? null;

        if (!availabilityFallback) {
          availabilityFallback = {
            id: -1,
            createdAt: new Date(),
            updatedAt: new Date(),
            roomId: room.id,
            date: localDate,
            isAvailable: true,
            customPrice: null,
            priceModifier: null,
            reason: null,
            bookedUnits: 0,
            totalUnits: room.totalUnits ?? 1,
          } as any;
        }

        const activePeakSeasons = peakSeasons.filter(
          (ps) =>
            localDate >= toLocalMidnight(ps.startDate) &&
            ps.endDate &&
            localDate <= toLocalMidnight(ps.endDate)
        );

        const { price, available } =
          this.availabilityService.getDailyCalculatedPrice(
            room.basePrice,
            availabilityFallback as RoomAvailabilityType | null,
            activePeakSeasons as PeakSeasonDto[]
          );

        return { date: dateKey, price, available };
      });

      return { roomId: room.id, roomName: room.name, dailyPrices };
    });

    return {
      property: { id: property.id, name: property.name },
      calendar: calendarData,
    };
  }
}
