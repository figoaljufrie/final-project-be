// modules/image/repository/image-repository.ts
import { Prisma, RoomImage } from "../../../generated/prisma";
import { prisma } from "../../../shared/utils/prisma";

// Define the structure for image data received from the service
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
    const data = images.map(img => ({
      roomId: roomId,
      url: img.url,
      publicId: img.publicId, // Store this public ID for potential later deletion
      altText: img.altText,
      isPrimary: img.isPrimary,
      order: img.order,
    }));

    // Use tx.roomImage as per your schema
    return tx.roomImage.createMany({ data });
  }
  
  // NOTE: You would add other methods here later (e.g., findById, updateOrder, delete).
}