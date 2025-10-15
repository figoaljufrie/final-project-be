import { CacheKeys } from "../../../../shared/helpers/cache-keys";
import {
  CalculatedPrice,
  calculateFinalRoomPrice,
} from "../../../../shared/helpers/price-calc";
import { cacheManager } from "../../../../shared/utils/redis/cache-manager";
import { RoomRepository } from "../../room/repository/room-repository";
import {
  PeakSeasonDto,
  RoomAvailabilityDto,
  SetAvailabilityBodyDto,
  SetAvailabilityRepoDto,
} from "../dto/availability-dto";
import { AvailabilityRepository } from "../repository/availability-repository";

export class AvailabilityService {
  private availabilityRepository = new AvailabilityRepository();
  private roomRepository = new RoomRepository();

  public async setAvailability(
    roomId: number,
    payload: SetAvailabilityBodyDto
  ) {
    const date = new Date(payload.date);
    date.setHours(0, 0, 0, 0);

    const repoData: SetAvailabilityRepoDto = {
      roomId: roomId,
      date: date,
      isAvailable: payload.isAvailable,
      customPrice: payload.customPrice,
      priceModifier: payload.priceModifier,
      reason: payload.reason,
    };

    const result = await this.availabilityRepository.upsert(repoData);

    // Invalidate related caches
    await this.invalidateAvailabilityCaches(roomId);

    return result;
  }

  public async getAvailabilityRange(roomId: number, from: Date, to: Date) {
    return this.availabilityRepository.findRange(roomId, from, to) as Promise<
      RoomAvailabilityDto[]
    >;
  }

  public async getAvailabilityByDate(roomId: number, date: Date) {
    return this.availabilityRepository.findByRoomAndDate(
      roomId,
      date
    ) as Promise<RoomAvailabilityDto | null>;
  }

  public async getBulkAvailabilityForRooms(
    roomIds: number[],
    from: Date,
    to: Date
  ) {
    return this.availabilityRepository.findBulkAvailability(
      roomIds,
      from,
      to
    ) as Promise<RoomAvailabilityDto[]>;
  }

  public getDailyCalculatedPrice(
    basePrice: number,
    availability: RoomAvailabilityDto | null,
    peakSeasons: PeakSeasonDto[]
  ): CalculatedPrice {
    return calculateFinalRoomPrice(basePrice, availability, peakSeasons);
  }

  /**
   * Invalidate availability-related caches
   */
  private async invalidateAvailabilityCaches(roomId: number): Promise<void> {
    try {
      // Get property ID for this room
      const roomData = await this.roomRepository.findPropertyId(roomId);
      if (!roomData) return;

      const propertyId = roomData.propertyId;

      // Invalidate availability cache
      await cacheManager.deletePattern(
        CacheKeys.patterns.allAvailabilityCache()
      );

      // Invalidate property calendar cache
      await cacheManager.deletePattern(
        CacheKeys.patterns.allCalendarCache(propertyId)
      );

      // Invalidate property details cache
      await cacheManager.deletePattern(
        CacheKeys.patterns.allPropertyCache(propertyId)
      );

      // Invalidate search cache
      await cacheManager.deletePattern(CacheKeys.patterns.allSearchCache());

      console.log(`🗑️ Invalidated availability caches for room ${roomId}`);
    } catch (error) {
      console.error("Cache invalidation error:", error);
    }
  }
}
