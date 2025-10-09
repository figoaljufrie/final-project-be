import { prisma } from "../../../../shared/utils/prisma";
import { Prisma } from "../../../../generated/prisma";

interface PropertyImageCreationData {
  url: string;
  // ❌ removed publicId since not in schema
  altText?: string;
  isPrimary: boolean;
  order: number;
}

export class PropertyImageRepository {
  public async createManyForPropertyWithTx(
    propertyId: number,
    images: PropertyImageCreationData[],
    tx: Prisma.TransactionClient
  ) {
    const data = images.map((img) => ({
      propertyId,
      url: img.url,
      altText: img.altText ?? "",
      isPrimary: img.isPrimary,
      order: img.order,
    }));

    return tx.propertyImage.createMany({ data });
  }

  public async updatePropertyImage(
    imageId: number,
    data: Partial<PropertyImageCreationData>
  ) {
    return prisma.propertyImage.update({
      where: { id: imageId },
      data,
    });
  }

  public async deletePropertyImage(imageId: number) {
    // ✅ No need to reference publicId since it doesn’t exist
    const image = await prisma.propertyImage.findUnique({
      where: { id: imageId },
    });

    if (!image) throw new Error("Property image not found");

    await prisma.propertyImage.delete({
      where: { id: imageId },
    });

    // Return the deleted image (in case service wants URL cleanup)
    return image.url;
  }
}
