import { CloudinaryUtils } from "../../../../shared/utils/cloudinary/cloudinary";
import { ImageFileInput, UploadedImageResult } from "../dto/image-dto";

export class ImageHelpers {
  private cloudinaryUtils = new CloudinaryUtils();

  public async uploadFiles(files: ImageFileInput[]): Promise<UploadedImageResult[]> {
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

  public async deleteFromCloudinary(publicIds: (string | null)[]) {
    const deletions = publicIds.map((id) =>
      id ? this.cloudinaryUtils.destroy(id) : Promise.resolve()
    );
    await Promise.all(deletions).catch((err) => {
      console.error("❌ Failed to cleanup Cloudinary images:", err);
    });
  }
}