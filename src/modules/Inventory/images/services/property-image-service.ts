import { prisma } from "../../../../shared/utils/prisma";
import { UploadedImageResult } from "../dto/image-dto";
import { ImageHelpers } from "../helpers/image-helpers";
import {
  PropertyImageCreationData,
  PropertyImageRepository,
} from "../repository/property-image-repository";

export class PropertyImageService {
  private propertyImageRepository = new PropertyImageRepository();
  private imageHelpers = new ImageHelpers();

  public async createImages(propertyId: number, files: UploadedImageResult[]) {
    const data: PropertyImageCreationData[] = files.map(
      ({ url, publicId, altText, isPrimary, order }) => ({
        url,
        publicId: publicId ?? null,
        altText: altText ?? "",
        isPrimary,
        order,
      })
    );

    return prisma.$transaction(async (tx) => {
      
      const createdImages =
        await this.propertyImageRepository.createManyForPropertyWithTx(
          propertyId,
          data,
          tx
        );

      return createdImages;
    });
  }

  public async updateImage(
    imageId: number,
    updateData: Partial<PropertyImageCreationData>
  ) {
    return this.propertyImageRepository.updatePropertyImage(
      imageId,
      updateData
    );
  }

  public async deleteImage(imageId: number) {
    const image = await prisma.propertyImage.findUnique({
      where: { id: imageId },
    });

    if (!image) throw new Error("Property image not found");

    await prisma.propertyImage.delete({ where: { id: imageId } });

    // delete from cloudinary
    if (image.publicId)
      await this.imageHelpers.deleteFromCloudinary([image.publicId]);

    return image.url;
  }
}
