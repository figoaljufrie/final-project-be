import { Request, Response } from "express";
import { errHandle } from "@/shared/helpers/err-handler";
import { succHandle } from "@/shared/helpers/succ-handler";
import { ImageHelpers } from "../helpers/image-helpers";
import { RoomImageService } from "../services/room-image-service";

export class RoomImageController {
  private roomImageService = new RoomImageService();
  private imageHelpers = new ImageHelpers();

  public uploadImages = async (req: Request, res: Response) => {
    try {
      const roomId = Number(req.params.roomId);
      const files = (req.files as Express.Multer.File[] | undefined) || [];

      const mergedFiles = files.map((file, i) => ({
        file,
        isPrimary: i === 0,
        order: i,
        altText: file.originalname,
      }));

      const uploaded = await this.imageHelpers.uploadFiles(mergedFiles);
      const result = await this.roomImageService.createImages(roomId, uploaded);

      succHandle(res, "Images uploaded successfully", result, 201);
    } catch (error) {
      errHandle(res, "Failed to upload images", 400, (error as Error).message);
    }
  };

  public updateImage = async (req: Request, res: Response) => {
    try {
      const imageId = Number(req.params.imageId);
      if (!imageId) throw new Error("Invalid imageId");

      const files = (req.files as Express.Multer.File[] | undefined) || [];

      if (files.length > 0) {
        const mergedFiles = files.map((file, i) => ({
          file,
          isPrimary: false,
          order: 0,
          altText: file.originalname,
        }));

        const uploaded = await this.imageHelpers.uploadFiles(mergedFiles);

        const uploadResult = uploaded && uploaded.length > 0 ? uploaded[0] : null;
        if (!uploadResult) throw new Error("Failed to upload image file");

        const updatePayload: any = {
          url: uploadResult.url,
          publicId: uploadResult.publicId ?? null,
          altText: uploadResult.altText ?? undefined,
        };

        const bodyPayload = req.body || {};
        if (bodyPayload.isPrimary !== undefined)
          updatePayload.isPrimary =
            bodyPayload.isPrimary === "true" || bodyPayload.isPrimary === true;
        if (bodyPayload.order !== undefined)
          updatePayload.order = Number(bodyPayload.order);

        const result = await this.roomImageService.updateImage(imageId, updatePayload);
        succHandle(res, "Image updated successfully", result, 200);
        return;
      }

      const payload = req.body || {};
      if (payload.isPrimary !== undefined)
        payload.isPrimary = payload.isPrimary === "true" || payload.isPrimary === true;
      if (payload.order !== undefined) payload.order = Number(payload.order);

      const result = await this.roomImageService.updateImage(imageId, payload);
      succHandle(res, "Image updated successfully", result, 200);
    } catch (error) {
      errHandle(res, "Failed to update image", 400, (error as Error).message);
    }
  };

  public deleteImage = async (req: Request, res: Response) => {
    try {
      const imageId = Number(req.params.imageId);
      if (!imageId) throw new Error("Invalid imageId");

      const result = await this.roomImageService.deleteImage(imageId);
      succHandle(res, "Image deleted successfully", result, 200);
    } catch (error) {
      errHandle(res, "Failed to delete image", 400, (error as Error).message);
    }
  };

  public deleteAll = async (req: Request, res: Response) => {
    try {
      const roomId = Number(req.params.roomId);
      if (!roomId) throw new Error("Invalid roomId");

      await this.roomImageService.deleteAll(roomId);
      succHandle(res, "All room images deleted successfully", null, 200);
    } catch (error) {
      errHandle(res, "Failed to delete all images", 400, (error as Error).message);
    }
  };
}