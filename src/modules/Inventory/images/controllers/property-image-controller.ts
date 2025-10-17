import { Request, Response } from "express";
import { PropertyImageService } from "../services/property-image-service";
import { ImageHelpers } from "../helpers/image-helpers";
import { succHandle } from "../../../../shared/helpers/succ-handler";
import { errHandle } from "@/shared/helpers/err-handler";

export class PropertyImageController {
  private propertyImageService = new PropertyImageService();
  private imageHelpers = new ImageHelpers();

  public uploadImages = async (req: Request, res: Response) => {
    try {
      const propertyId = Number(req.params.propertyId);
      const files = (req.files as Express.Multer.File[] | undefined) || [];

      const mergedFiles = files.map((file, i) => ({
        file,
        isPrimary: i === 0,
        order: i,
        altText: file.originalname,
      }));

      const uploaded = await this.imageHelpers.uploadFiles(mergedFiles);
      const result = await this.propertyImageService.createImages(
        propertyId,
        uploaded
      );

      succHandle(res, "Images uploaded successfully", result, 201);
    } catch (error) {
      errHandle(res, "Failed to upload images", 400, (error as Error).message);
    }
  };

  public updateImage = async (req: Request, res: Response) => {
    try {
      const imageId = Number(req.params.imageId);
      const payload = req.body;

      const result = await this.propertyImageService.updateImage(
        imageId,
        payload
      );
      succHandle(res, "Image updated successfully", result, 200);
    } catch (error) {
      errHandle(res, "Failed to update image", 400, (error as Error).message);
    }
  };

  public deleteImage = async (req: Request, res: Response) => {
    try {
      const imageId = Number(req.params.imageId);
      const result = await this.propertyImageService.deleteImage(imageId);
      succHandle(res, "Image deleted successfully", result, 200);
    } catch (error) {
      errHandle(res, "Failed to delete image", 400, (error as Error).message);
    }
  };
}
