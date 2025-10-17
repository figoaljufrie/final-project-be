import { CacheKeys } from "../../../../shared/helpers/cache-keys";
import { ApiError } from "../../../../shared/utils/api-error";
import { prisma } from "../../../../shared/utils/prisma";
import { cacheManager } from "../../../../shared/utils/redis/cache-manager";
import { AvailabilityRepository } from "../../availability/repository/availability-repository";
import { PropertyRepository } from "../../property/repository/property-repository";
import { CreateRoomDto, RoomCreateTxDto } from "../dto/room-dto";
import { RoomRepository } from "../repository/room-repository";
import { RoomCacheService } from "./room-cache";

export class RoomCoreService {
  private roomRepository = new RoomRepository();
  private propertyRepository = new PropertyRepository();
  private availabilityRepository = new AvailabilityRepository();
  private roomCacheService = new RoomCacheService();

  public async create(tenantId: number, payload: CreateRoomDto) {
    const property = await this.propertyRepository.findById(payload.propertyId);
    if (!property || property.tenantId !== tenantId) {
      throw new ApiError("Property not found or access denied", 403);
    }

    const totalUnits = payload.totalUnits ?? 1;
    const roomData: RoomCreateTxDto = {
      propertyId: payload.propertyId,
      name: payload.name,
      capacity: payload.capacity,
      basePrice: payload.basePrice,
      description: payload.description ?? null,
      totalUnits,
    };

    const createdRoom = await prisma.$transaction(async (tx) => {
      const room = await this.roomRepository.createWithTx(roomData, tx);

      // Availability seeding
      await this.availabilityRepository.seedAvailabilityWithTx(
        room.id,
        room.totalUnits,
        tx
      );

      return room;
    });

    // Invalidate caches
    await this.roomCacheService.invalidateRoomCaches(payload.propertyId);

    return createdRoom;
  }

  public async updateRoom(
    tenantId: number,
    propertyId: number,
    roomId: number,
    data: Partial<RoomCreateTxDto>
  ) {
    const room = await this.roomRepository.findById(roomId);
    if (!room) throw new ApiError("Room not found", 404);

    const property = await this.propertyRepository.findById(propertyId);
    if (!property || property.tenantId !== tenantId) {
      throw new ApiError("Not authorized to update this room", 403);
    }

    await this.roomRepository.update(roomId, data);
    await this.roomCacheService.invalidateRoomCaches(propertyId);

    const updatedRoom = await this.roomRepository.findById(roomId);
    if (!updatedRoom) throw new ApiError("Failed to fetch updated room", 500);

    return updatedRoom;
  }

  public async deleteRoom(
    tenantId: number,
    propertyId: number,
    roomId: number
  ) {
    const room = await this.roomRepository.findById(roomId);
    if (!room) throw new ApiError("Room not found", 404);

    const property = await this.propertyRepository.findById(propertyId);
    if (!property || property.tenantId !== tenantId) {
      throw new ApiError("Not authorized to delete this room", 403);
    }

    const result = await this.roomRepository.softDelete(roomId);
    await this.roomCacheService.invalidateRoomCaches(propertyId);

    return result;
  }

  public async getRoomsByProperty(propertyId: number) {
    const cacheKey = CacheKeys.roomsByProperty(propertyId);

    return cacheManager.getOrSet(
      cacheKey,
      async () => {
        console.log("⚙️ Fetching rooms from database...");
        return await this.roomRepository.findByProperty(propertyId);
      },
      900
    );
  }

  public async getRoomById(roomId: number) {
    const room = await this.roomRepository.findById(roomId);
    if (!room) throw new ApiError("Room not found", 404);
    return room;
  }
}
