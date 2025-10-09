import { prisma } from "../../../../shared/utils/prisma";
import { Prisma } from "../../../../generated/prisma";

interface RoomImageCreationData {
  url: string;
  publicId: string; // Essential for Cloudinary cleanup
  altText?: string;
  isPrimary: boolean;
  order: number;
}

export class RoomImageRepository {
  public async createManyForRoomWithTx(
    roomId: number,
    images: RoomImageCreationData[],
    tx: Prisma.TransactionClient
  ) {
    const data = images.map((img) => ({
      roomId: roomId,
      url: img.url,
      publicId: img.publicId,
      altText: img.altText ?? "",
      isPrimary: img.isPrimary,
      order: img.order,
    }));

    return tx.roomImage.createMany({ data });
  }

  public async updateRoomImage(
    imageId: number,
    data: Partial<RoomImageCreationData>
  ) {
    return prisma.roomImage.update({
      where: { id: imageId },
      data: {
        ...data,
      },
    });
  }

  public async deleteRoomImage(imageId: number) {
    const image = await prisma.roomImage.findUnique({
      where: { id: imageId },
    });

    if (!image) throw new Error("Room image not found");

    await prisma.roomImage.delete({
      where: { id: imageId },
    });

    return image.publicId;
  }
}
