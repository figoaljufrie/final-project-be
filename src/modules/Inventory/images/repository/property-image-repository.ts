import { prisma } from "../../../../shared/utils/prisma";
import { Prisma } from "../../../../generated/prisma";

export interface PropertyImageCreationData {
  url: string;
  publicId?: string | null;
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
    if (!propertyId) throw new Error("propertyId is required");
    if (!images || images.length === 0) return [];

    // ✅ DO NOT DELETE OLD IMAGES (keep existing)
    // Only insert new ones
    const data = images.map((img) => ({
      propertyId,
      url: img.url,
      publicId: img.publicId ?? null,
      altText: img.altText ?? "",
      isPrimary: img.isPrimary,
      order: img.order,
    }));

    await tx.propertyImage.createMany({ data });

    // ✅ Fetch all images for that property (not only newly created)
    const allImages = await tx.propertyImage.findMany({
      where: { propertyId },
      orderBy: [{ isPrimary: "desc" }, { order: "asc" }, { createdAt: "desc" }],
    });

    return allImages;
  }

  public async updatePropertyImage(
    imageId: number,
    data: Partial<PropertyImageCreationData>
  ) {
    const existing = await prisma.propertyImage.findUnique({
      where: { id: imageId },
    });
    if (!existing) throw new Error("Property image not found");

    return prisma.propertyImage.update({
      where: { id: imageId },
      data: {
        ...data,
        publicId: data.publicId ?? existing.publicId ?? null,
      },
    });
  }

  public async deletePropertyImage(imageId: number) {
    const image = await prisma.propertyImage.findUnique({
      where: { id: imageId },
    });

    if (!image) throw new Error("Property image not found");

    await prisma.propertyImage.delete({
      where: { id: imageId },
    });

    return image.url;
  }
}
