import { Prisma } from "../../../../generated/prisma";
import { ApiError } from "../../../../shared/utils/api-error";
import { CloudinaryUtils } from "../../../../shared/utils/cloudinary/cloudinary";
import { prisma } from "../../../../shared/utils/prisma";
import { ImageRepository } from "../../images/image-repository";
import { AvailabilityRepository } from "../../pricing/repository/availability-repository";
import { PropertyRepository } from "../../property/repository/property-repository";
import { CreateRoomDto, RoomCreateTxDto } from "../dto/room-dto";
import { RoomRepository } from "../repository/room-repository";

interface UploadedImageResult {
  url: string;
  publicId: string;
  altText: string;
  isPrimary: boolean;
  order: number;
}

export class RoomService {
  private roomRepository = new RoomRepository();
  private propertyRepository = new PropertyRepository();
  private imageRepository = new ImageRepository();
  // 1. UPDATED PROPERTY NAME: Use availabilityRepository
  private availabilityRepository = new AvailabilityRepository();
  private cloudinaryUtils = new CloudinaryUtils();

  public async create(tenantId: number, payload: CreateRoomDto) {
    const property = await this.propertyRepository.findById(payload.propertyId);
    if (!property || property.tenantId !== tenantId) {
      throw new ApiError("Property not found or access denied.", 403);
    }

    const totalUnits = payload.totalUnits ?? 1;

    let uploadedImages: UploadedImageResult[] = [];
    let uploadPublicIds: string[] = [];

    try {
      const imageUploadPromises = (payload.images || []).map(async (img) => {
        const result = await this.cloudinaryUtils.upload(img.file);

        const uploadedImage: UploadedImageResult = {
          url: result.secure_url,
          publicId: result.public_id,
          altText: img.altText,
          isPrimary: img.isPrimary,
          order: img.order,
        };
        uploadPublicIds.push(result.public_id);
        return uploadedImage;
      });

      uploadedImages = await Promise.all(imageUploadPromises);
    } catch (uploadError) {
      throw new ApiError(
        "Failed to upload one or more images to cloud storage.",
        500
      );
    }

    const roomData: RoomCreateTxDto = {
      propertyId: payload.propertyId,
      name: payload.name,
      capacity: payload.capacity,
      basePrice: payload.basePrice,
      description: payload.description ?? null,
      totalUnits: totalUnits,
    };

    try {
      const newRoom = await prisma.$transaction(
        async (tx) => {
          const createdRoom = await this.roomRepository.createWithTx(
            roomData,
            tx
          );

          if (uploadedImages.length > 0) {
            await this.imageRepository.createManyForRoomWithTx(
              createdRoom.id,
              uploadedImages,
              tx
            );
          }

          // 2. UPDATED CALL: Use the new availabilityRepository
          await this.availabilityRepository.seedAvailabilityWithTx(
            createdRoom.id,
            createdRoom.totalUnits,
            tx
          );

          return createdRoom;
        },
        { timeout: 10000 }
      );

      return newRoom;
    } catch (dbError) {
      console.error(
        "Transactional Room Creation Failed. Initiating Cloudinary cleanup."
      );

      await Promise.allSettled(
        uploadPublicIds.map((publicId) =>
          this.cloudinaryUtils.destroy(publicId)
        )
      );

      throw new ApiError(
        "Failed to save room details to database. Cloud files cleaned up.",
        500
      );
    }
  }

  public async updateRoom(
    roomId: number,
    propertyId: number,
    data: Partial<Prisma.RoomUpdateInput>
  ) {
    const room = await this.roomRepository.findById(roomId);
    if (!room) throw new ApiError("Room did not exist", 404);

    if (room.propertyId !== propertyId) {
      throw new ApiError("Room does not belong to specified Property.", 400);
    }

    return this.roomRepository.update(roomId, data);
  }

  public async deleteRoom(roomId: number, propertyId: number) {
    const room = await this.roomRepository.findById(roomId);
    if (!room) throw new ApiError("Room does not exist", 404);

    if (room.propertyId !== propertyId) {
      throw new ApiError("Room does not belong to specified property", 400);
    }

    return this.roomRepository.softDelete(roomId);
  }

  public async getRoomsByProperty(propertyId: number) {
    return this.roomRepository.findByProperty(propertyId);
  }
}
