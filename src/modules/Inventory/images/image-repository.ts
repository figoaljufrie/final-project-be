import { Prisma } from "../../../generated/prisma";

interface ImageCreationData {
  url: string;
  publicId: string; // Essential for Cloudinary cleanup
  altText: string;
  isPrimary: boolean;
  order: number;
}

export class ImageRepository {
  /**
   * Creates multiple RoomImage records and links them to a specific room,
   * all within the provided database transaction context (tx).
   * * @param roomId The ID of the room to link the images to.
   * @param images An array of image data objects.
   * @param tx The Prisma TransactionClient.
   * @returns A promise resolving to the result of the createMany operation.
   */
  public async createManyForRoomWithTx(
    roomId: number,
    images: ImageCreationData[],
    tx: Prisma.TransactionClient
  ) {
    const data = images.map((img) => ({
      roomId: roomId,
      url: img.url,
      publicId: img.publicId,
      altText: img.altText,
      isPrimary: img.isPrimary,
      order: img.order,
    }));

    return tx.roomImage.createMany({ data });
  }
}
