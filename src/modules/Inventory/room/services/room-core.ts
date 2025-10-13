import { CacheKeys } from "../../../../shared/helpers/cache-keys";
import { ApiError } from "../../../../shared/utils/api-error";
import { prisma } from "../../../../shared/utils/prisma";
import { cacheManager } from "../../../../shared/utils/redis/cache-manager";
import { ImageFileInput } from "../../images/dto/image-dto";
import { ImageService } from "../../images/services/image-service";
import { AvailabilityRepository } from "../../pricing/repository/availability-repository";
import { PropertyRepository } from "../../property/repository/property-repository";
import { CreateRoomDto, RoomCreateTxDto } from "../dto/room-dto";
import { RoomRepository } from "../repository/room-repository";
import { RoomCacheService } from "./room-cache";

export class RoomCoreService {
  private roomRepository = new RoomRepository();
  private propertyRepository = new PropertyRepository();
  private availabilityRepository = new AvailabilityRepository();
  private imageService = new ImageService();
  private roomCacheService = new RoomCacheService();

  public async create(
    tenantId: number,
    payload: CreateRoomDto,
    files?: ImageFileInput[]
  ) {
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

      // Image handling
      if (files && files.length > 0) {
        await this.imageService.handleCreateImages("room", room.id, files);
      }

      // Availability seeding
      await this.availabilityRepository.seedAvailabilityWithTx(
        room.id,
        room.totalUnits,
        tx
      );

      return room;
    });

    // Invalidate caches after room creation
    await this.roomCacheService.invalidateRoomCaches(payload.propertyId);

    return createdRoom;
  }

  public async updateRoom(
    tenantId: number,
    propertyId: number,
    roomId: number,
    data: Partial<RoomCreateTxDto>,
    files?: ImageFileInput[]
  ) {
    const room = await this.roomRepository.findById(roomId);
    if (!room) throw new ApiError("Room not found", 404);

    const property = await this.propertyRepository.findById(propertyId);
    if (!property || property.tenantId !== tenantId) {
      throw new ApiError("Not authorized to update this room", 403);
    }

    // Update room data
    await this.roomRepository.update(roomId, data);

    // Handle images if provided
    if (files && files.length > 0) {
      await this.imageService.handleUpdateImages("room", roomId, files);
    }

    // Invalidate caches
    await this.roomCacheService.invalidateRoomCaches(propertyId);

    // Fetch updated room with all relations
    const updatedRoom = await this.roomRepository.findById(roomId);

    if (!updatedRoom) {
      throw new ApiError("Failed to fetch updated room", 500);
    }

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

    await this.imageService.handleDeleteImages("room", roomId);

    const result = await this.roomRepository.softDelete(roomId);

    // Invalidate caches
    await this.roomCacheService.invalidateRoomCaches(propertyId);

    return result;
  }

  public async getRoomsByProperty(propertyId: number) {
    // Cache room list
    const cacheKey = CacheKeys.roomsByProperty(propertyId);

    return cacheManager.getOrSet(
      cacheKey,
      async () => {
        console.log("⚙️ Fetching rooms from database...");
        return await this.roomRepository.findByProperty(propertyId);
      },
      900 // 15 minutes TTL
    );
  }
}
