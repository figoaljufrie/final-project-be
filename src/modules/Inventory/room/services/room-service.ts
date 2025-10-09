import { ApiError } from "../../../../shared/utils/api-error";
import { prisma } from "../../../../shared/utils/prisma";
import { ImageService } from "../../images/services/image-service";
import { AvailabilityRepository } from "../../pricing/repository/availability-repository";
import { PropertyRepository } from "../../property/repository/property-repository";
import { CreateRoomDto, RoomCreateTxDto } from "../dto/room-dto";
import { RoomRepository } from "../repository/room-repository";

interface ImageFileInput {
  file: Express.Multer.File;
  altText?: string;
  isPrimary: boolean;
  order: number;
}

export class RoomService {
  private roomRepository = new RoomRepository();
  private propertyRepository = new PropertyRepository();
  private availabilityRepository = new AvailabilityRepository();
  private imageService = new ImageService();

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

    return prisma.$transaction(async (tx) => {
      const createdRoom = await this.roomRepository.createWithTx(roomData, tx);

      // Image handling (with metadata)
      if (files && files.length > 0) {
        await this.imageService.handleCreateImages(
          "room",
          createdRoom.id,
          files
        );
      }

      // Availability seeding
      await this.availabilityRepository.seedAvailabilityWithTx(
        createdRoom.id,
        createdRoom.totalUnits,
        tx
      );

      return createdRoom;
    });
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

    // ✅ Update room data first
    await this.roomRepository.update(roomId, data);

    // ✅ Handle images if provided
    if (files && files.length > 0) {
      await this.imageService.handleUpdateImages("room", roomId, files);
    }

    // ✅ CRITICAL FIX: Fetch the updated room with all relations AFTER all operations
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

    return this.roomRepository.softDelete(roomId);
  }

  public async getRoomsByProperty(propertyId: number) {
    return this.roomRepository.findByProperty(propertyId);
  }
}
