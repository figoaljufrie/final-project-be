import { Prisma } from "../../../generated/prisma";
import { CloudinaryUtils } from "../../../shared/utils/cloudinary/cloudinary";
import { prisma } from "../../../shared/utils/prisma";
import { PropertyImageRepository } from "../../Inventory/images/repository/property-image-repository";
import { RoomImageRepository } from "./repository/room-image-repository";

interface ImageFileInput {
  file: Express.Multer.File;
  altText?: string;
  isPrimary: boolean;
  order: number;
}

export class ImageService {
  private cloudinary = new CloudinaryUtils();
  private propertyImageRepository = new PropertyImageRepository();
  private roomImageRepository = new RoomImageRepository();

  /**
   * Handles both property and room image uploads.
   * @param type "property" | "room"
   * @param targetId propertyId or roomId
   * @param files uploaded files
   */
  public async handleCreateImages(
    type: "property" | "room",
    targetId: number,
    files: ImageFileInput[]
  ) {
    if (!files?.length) return;

    await prisma.$transaction(async (tx) => {
      const uploadedImages = await Promise.all(
        files.map(async (f) => {
          const uploadResult = await this.cloudinary.upload(f.file);
          return {
            url: uploadResult.secure_url,
            altText: f.altText ?? "",
            isPrimary: f.isPrimary,
            order: f.order,
            publicId: uploadResult.public_id,
          };
        })
      );

      if (type === "property") {
        // Ensure only one primary image
        const hasPrimary = uploadedImages.some((img) => img.isPrimary);
        uploadedImages.forEach((img, i) => {
          if (!hasPrimary) img.isPrimary = i === 0; // fallback first image
          else if (img.isPrimary) img.isPrimary = true;
          else img.isPrimary = false;
        });

        await this.propertyImageRepository.createManyForPropertyWithTx(
          targetId,
          uploadedImages.map((img, i) => ({
            url: img.url,
            altText: img.altText,
            isPrimary: img.isPrimary,
            order: img.order ?? i,
          })),
          tx
        );
      } else {
        const hasPrimary = uploadedImages.some((img) => img.isPrimary);
        uploadedImages.forEach((img, i) => {
          if (!hasPrimary) img.isPrimary = i === 0;
          else if (img.isPrimary) img.isPrimary = true;
          else img.isPrimary = false;
        });

        await this.roomImageRepository.createManyForRoomWithTx(
          targetId,
          uploadedImages.map((img, i) => ({
            url: img.url,
            publicId: img.publicId,
            altText: img.altText,
            isPrimary: img.isPrimary,
            order: img.order ?? i,
          })),
          tx
        );
      }
    });
  }

  /**
   * Updates existing images for a property or room.
   * Old images are deleted, new ones uploaded, and primary logic applied.
   */
  public async handleUpdateImages(
    type: "property" | "room",
    targetId: number,
    files: ImageFileInput[]
  ) {
    if (!files?.length) return;

    await prisma.$transaction(async (tx) => {
      if (type === "property") {
        const oldImages = await tx.propertyImage.findMany({
          where: { propertyId: targetId },
        });
        await tx.propertyImage.deleteMany({ where: { propertyId: targetId } });

        for (const img of oldImages) {
          try {
            await this.cloudinary.destroy(img.url);
          } catch (err) {
            console.warn("⚠️ Failed to delete old Cloudinary image:", err);
          }
        }

        await this.handleCreateImages("property", targetId, files);
      } else {
        const oldImages = await tx.roomImage.findMany({
          where: { roomId: targetId },
        });
        await tx.roomImage.deleteMany({ where: { roomId: targetId } });

        for (const img of oldImages) {
          try {
            await this.cloudinary.destroy(img.url);
          } catch (err) {
            console.warn("⚠️ Failed to delete old Cloudinary image:", err);
          }
        }

        await this.handleCreateImages("room", targetId, files);
      }
    });
  }

  /**
   * Sets a single image as primary for a property or room.
   */
  public async setPrimaryImage(
    type: "property" | "room",
    targetId: number,
    imageId: number
  ) {
    if (type === "property") {
      await prisma.$transaction([
        prisma.propertyImage.updateMany({
          where: { propertyId: targetId },
          data: { isPrimary: false },
        }),
        prisma.propertyImage.update({
          where: { id: imageId },
          data: { isPrimary: true },
        }),
      ]);
    } else {
      await prisma.$transaction([
        prisma.roomImage.updateMany({
          where: { roomId: targetId },
          data: { isPrimary: false },
        }),
        prisma.roomImage.update({
          where: { id: imageId },
          data: { isPrimary: true },
        }),
      ]);
    }
  }

  /**
   * Delete all images for a property or room (for cleanup).
   */
  public async handleDeleteImages(type: "property" | "room", targetId: number) {
    await prisma.$transaction(async (tx) => {
      if (type === "property") {
        const images = await tx.propertyImage.findMany({
          where: { propertyId: targetId },
        });
        await tx.propertyImage.deleteMany({ where: { propertyId: targetId } });

        for (const img of images) {
          try {
            await this.cloudinary.destroy(img.url);
          } catch {
            /* ignore */
          }
        }
      } else {
        const images = await tx.roomImage.findMany({
          where: { roomId: targetId },
        });
        await tx.roomImage.deleteMany({ where: { roomId: targetId } });

        for (const img of images) {
          try {
            await this.cloudinary.destroy(img.url);
          } catch {
            /* ignore */
          }
        }
      }
    });
  }
}
