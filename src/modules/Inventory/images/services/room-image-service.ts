import { prisma } from "../../../../shared/utils/prisma";
import { UploadedImageResult } from "../dto/image-dto";
import { ImageHelpers } from "../helpers/image-helpers";
import {
  RoomImageCreationData,
  RoomImageRepository,
} from "../repository/room-image-repository";

export class RoomImageService {
  private roomImageRepository = new RoomImageRepository();
  private imageHelpers = new ImageHelpers();

  public async createImages(roomId: number, files: UploadedImageResult[]) {
    const data: RoomImageCreationData[] = files.map(
      ({ url, publicId, altText, isPrimary, order }) => ({
        url,
        publicId: publicId!,
        altText: altText ?? "",
        isPrimary,
        order,
      })
    );

    return prisma.$transaction(async (tx) => {
      return this.roomImageRepository.createManyForRoomWithTx(roomId, data, tx);
    });
  }

  /**
   * Update image metadata
   */
  public async updateImage(
    imageId: number,
    updateData: Partial<RoomImageCreationData>
  ) {
    return this.roomImageRepository.updateRoomImage(imageId, updateData);
  }

  public async deleteImage(imageId: number) {
    const image = await prisma.roomImage.findUnique({ where: { id: imageId } });
    if (!image) throw new Error("Room image not found");

    await prisma.roomImage.delete({ where: { id: imageId } });

    if (image.publicId)
      await this.imageHelpers.deleteFromCloudinary([image.publicId]);

    return image.url;
  }

  public async deleteAll(roomId: number) {
    const images = await prisma.roomImage.findMany({ where: { roomId } });
    await prisma.roomImage.deleteMany({ where: { roomId } });

    const publicIds = images.map((img) => img.publicId);
    await this.imageHelpers.deleteFromCloudinary(publicIds);
  }
}
