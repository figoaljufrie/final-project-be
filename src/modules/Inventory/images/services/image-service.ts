import { Prisma } from "../../../../generated/prisma";
import { CloudinaryUtils } from "../../../../shared/utils/cloudinary/cloudinary";
import { prisma } from "../../../../shared/utils/prisma";
import { ImageFileInput, UploadedImageResult } from "../dto/image-dto";
import { PropertyImageRepository } from "../repository/property-image-repository";
import { RoomImageRepository } from "../repository/room-image-repository";

type EntityType = "property" | "room";

export class ImageService {
  private roomImageRepository = new RoomImageRepository();
  private propertyImageRepository = new PropertyImageRepository();
  private cloudinaryUtils = new CloudinaryUtils();

  public async handleCreateImages(
    entity: EntityType,
    entityId: number,
    files?: ImageFileInput[]
  ) {
    if (!files || files.length === 0) return;

    return prisma.$transaction(async (tx) => {
      const uploaded = await this.uploadToCloudinary(entity, files);
      await this.createManyWithTx(entity, entityId, uploaded, tx);
    });
  }

  public async handleUpdateImages(
    entity: EntityType,
    entityId: number,
    files?: ImageFileInput[]
  ) {
    if (!files || files.length === 0) return;

    return prisma.$transaction(async (tx) => {
      if (entity === "room") {
        const existing = await tx.roomImage.findMany({
          where: { roomId: entityId },
        });

        for (const img of existing) {
          if (img.publicId) await this.cloudinaryUtils.destroy(img.publicId);
        }

        await tx.roomImage.deleteMany({ where: { roomId: entityId } });
      } else {
        await tx.propertyImage.deleteMany({ where: { propertyId: entityId } });
      }

      const uploaded = await this.uploadToCloudinary(entity, files);
      await this.createManyWithTx(entity, entityId, uploaded, tx);
    });
  }

  public async handleDeleteImages(entity: EntityType, entityId: number) {
    if (entity === "room") {
      const images = await prisma.roomImage.findMany({
        where: { roomId: entityId },
      });
      for (const img of images) {
        if (img.publicId) await this.cloudinaryUtils.destroy(img.publicId);
      }
      await prisma.roomImage.deleteMany({ where: { roomId: entityId } });
    } else {
      await prisma.propertyImage.deleteMany({
        where: { propertyId: entityId },
      });
    }
  }

  private async uploadToCloudinary(
    entity: EntityType,
    files: ImageFileInput[]
  ): Promise<UploadedImageResult[]> {
    // ✅ Upload BOTH room and property images to Cloudinary
    const uploads = files.map(async (img) => {
      const result = await this.cloudinaryUtils.upload(img.file);

      if (entity === "room") {
        return {
          url: result.secure_url,
          publicId: result.public_id,
          altText: img.altText ?? "",
          isPrimary: img.isPrimary,
          order: img.order,
        };
      }

      // Property images - also upload to Cloudinary
      return {
        url: result.secure_url,
        // publicId not in PropertyImage schema, so omit it
        altText: img.altText ?? "",
        isPrimary: img.isPrimary,
        order: img.order,
      };
    });

    return Promise.all(uploads);
  }

  private async createManyWithTx(
    entity: EntityType,
    entityId: number,
    images: UploadedImageResult[],
    tx: Prisma.TransactionClient
  ) {
    if (entity === "room") {
      return this.roomImageRepository.createManyForRoomWithTx(
        entityId,
        images.filter((img) => img.publicId) as any, // Only rooms have publicId
        tx
      );
    }

    // Property images don't need publicId
    return this.propertyImageRepository.createManyForPropertyWithTx(
      entityId,
      images.map(({ publicId, ...rest }) => rest), // Remove publicId
      tx
    );
  }
}
