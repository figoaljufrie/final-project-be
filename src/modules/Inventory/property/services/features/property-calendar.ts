import { RoomAvailability as PrismaRoomAvailability } from "../../../../../generated/prisma";
import { CacheKeys } from "../../../../../shared/helpers/cache-keys";
import { ApiError } from "../../../../../shared/utils/api-error";
import { cacheManager } from "../../../../../shared/utils/redis/cache-manager";
import { cacheConfig } from "../../../../../shared/utils/redis/redis-config";
import { PeakSeasonDto } from "../../../pricing/dto/availability-dto";
import { AvailabilityService } from "../../../pricing/services/availability-service";
import { PeakSeasonService } from "../../../pricing/services/peak-season-service";
import {
  buildAvailabilityMap,
  getDateRange,
} from "../../helpers/property-helpers";
import { PropertyRepository } from "../../repository/property-repository";

type RoomAvailabilityType = PrismaRoomAvailability;

export class PropertyCalendarService {
  private propertyRepository = new PropertyRepository();
  private availabilityService = new AvailabilityService();
  private peakSeasonService = new PeakSeasonService();

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

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    const roomIds = property.rooms.map((r) => r.id);
    const dateRange = getDateRange(startDate, endDate, true);

    const [peakSeasons, availabilityData] = await Promise.all([
      this.peakSeasonService.findActivePeakSeasonsForProperty(
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
        const dateKey = date.toISOString().split("T")[0];
        const availability = availMap.get(`${room.id}-${dateKey}`) ?? null;
        const activePeakSeasons = peakSeasons.filter(
          (ps) => date >= ps.startDate && ps.endDate && date <= ps.endDate
        );

        const { price, available } =
          this.availabilityService.getDailyCalculatedPrice(
            room.basePrice,
            availability as RoomAvailabilityType | null,
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
