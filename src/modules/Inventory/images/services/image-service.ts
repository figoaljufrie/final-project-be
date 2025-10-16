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

    const uploaded = await this.uploadToCloudinary(entity, files);

    return prisma.$transaction(async (tx) => {
      await this.createManyWithTx(entity, entityId, uploaded, tx);
    });
  }

  public async handleUpdateImages(
    entity: EntityType,
    entityId: number,
    files?: ImageFileInput[]
  ) {
    if (!files || files.length === 0) return;

    const uploaded = await this.uploadToCloudinary(entity, files);

    return prisma.$transaction(async (tx) => {
      if (entity === "room") {
        const existing = await tx.roomImage.findMany({
          where: { roomId: entityId },
        });

        await tx.roomImage.deleteMany({ where: { roomId: entityId } });

        await this.createManyWithTx(entity, entityId, uploaded, tx);

        Promise.all(
          existing.map((img) =>
            img.publicId
              ? this.cloudinaryUtils.destroy(img.publicId)
              : Promise.resolve()
          )
        ).catch((err) => {
          console.error("❌ Failed to cleanup old Cloudinary images:", err);
        });
      } else {
        await tx.propertyImage.deleteMany({ where: { propertyId: entityId } });
        await this.createManyWithTx(entity, entityId, uploaded, tx);
      }
    });
  }

  public async handleDeleteImages(entity: EntityType, entityId: number) {
    if (entity === "room") {
      const images = await prisma.roomImage.findMany({
        where: { roomId: entityId },
      });

      await prisma.roomImage.deleteMany({ where: { roomId: entityId } });

      Promise.all(
        images.map((img) =>
          img.publicId
            ? this.cloudinaryUtils.destroy(img.publicId)
            : Promise.resolve()
        )
      ).catch((err) => {
        console.error("❌ Failed to cleanup Cloudinary images:", err);
      });
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

      return {
        url: result.secure_url,
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
        images.filter((img) => img.publicId) as any,
        tx
      );
    }

    return this.propertyImageRepository.createManyForPropertyWithTx(
      entityId,
      images.map(({ publicId, ...rest }) => rest),
      tx
    );
  }
}
