import { prisma } from "../../../../shared/utils/prisma";
import { Prisma } from "../../../../generated/prisma";

export interface RoomImageCreationData {
  url: string;
  publicId: string; // not nullable
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
      roomId,
      url: img.url,
      publicId: img.publicId, // must always be string
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
    // publicId must always be string
    const updateData = { ...data } as { [key: string]: any };
    if (updateData.publicId === undefined) delete updateData.publicId;

    return prisma.roomImage.update({
      where: { id: imageId },
      data: updateData,
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
