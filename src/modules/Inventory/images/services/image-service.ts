import { prisma } from "../../../../shared/utils/prisma";
import { Prisma } from "../../../../generated/prisma";
import { CloudinaryUtils } from "../../../../shared/utils/cloudinary/cloudinary";
import { RoomImageRepository } from "../repository/room-image-repository";
import { PropertyImageRepository } from "../repository/property-image-repository";

type EntityType = "property" | "room";

interface UploadedImageResult {
  url: string;
  publicId?: string;
  altText?: string;
  isPrimary: boolean;
  order: number;
}

interface ImageFileInput {
  file: Express.Multer.File;
  altText?: string;
  isPrimary: boolean;
  order: number;
}

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
    if (entity === "room") {
      const uploads = files.map(async (img) => {
        const result = await this.cloudinaryUtils.upload(img.file);
        return {
          url: result.secure_url,
          publicId: result.public_id,
          altText: img.altText ?? "",
          isPrimary: img.isPrimary,
          order: img.order,
        };
      });
      return Promise.all(uploads);
    }

    return files.map((img) => ({
      url: `/uploads/${img.file.filename}`,
      altText: img.altText ?? "",
      isPrimary: img.isPrimary,
      order: img.order,
    }));
  }

  private async createManyWithTx(
    entity: EntityType,
    entityId: number,
    images: UploadedImageResult[],
    tx: Prisma.TransactionClient
  ) {
    if (entity === "room") {
      // Safe cast since room uploads always have publicId
      return this.roomImageRepository.createManyForRoomWithTx(
        entityId,
        images as {
          url: string;
          publicId: string;
          altText?: string;
          isPrimary: boolean;
          order: number;
        }[],
        tx
      );
    }

    return this.propertyImageRepository.createManyForPropertyWithTx(
      entityId,
      images,
      tx
    );
  }
}
