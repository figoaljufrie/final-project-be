import { Request } from "express";
import { ImageMetadata } from "../../images/dto/image-dto";
import { CreateRoomImagePayload, ParsedRoomBody } from "../dto/room-dto";

export function parseAndValidateRoomCreation(req: Request): {
  parsedBody: ParsedRoomBody;
  structuredImages: CreateRoomImagePayload[];
} {
  const {
    name,
    capacity,
    basePrice,
    description,
    totalUnits,
    images: imagesJson,
  } = req.body;

  // FIX: multer.array() puts files in req.files as an array, not an object
  const imageFiles = (req.files as Express.Multer.File[]) || [];

  if (typeof name !== "string" || !name) {
    throw new Error("Room name is required.");
  }
  if (isNaN(Number(capacity)) || Number(capacity) <= 0) {
    throw new Error("Invalid capacity.");
  }
  if (isNaN(Number(basePrice)) || Number(basePrice) <= 0) {
    throw new Error("Invalid base price.");
  }

  let imagesMetadata: ImageMetadata[] = [];
  if (imagesJson) {
    try {
      imagesMetadata = JSON.parse(imagesJson);
    } catch (e) {
      throw new Error("Invalid 'images' metadata format.");
    }
  }

  // Allow creation without images
  if (imageFiles.length > 0 && imageFiles.length !== imagesMetadata.length) {
    throw new Error(
      `Image files (${imageFiles.length}) and metadata (${imagesMetadata.length}) count mismatch.`
    );
  }

  const structuredImages: CreateRoomImagePayload[] = imageFiles.map(
    (file, index) => ({
      file,
      isPrimary: imagesMetadata[index]?.isPrimary ?? index === 0,
      order: imagesMetadata[index]?.order ?? index,
      altText: `${name} photo ${index + 1}`,
    })
  );

  const parsedBody: ParsedRoomBody = {
    name,
    capacity: Number(capacity),
    basePrice: Number(basePrice),
    ...(description && { description }),
    ...(totalUnits && { totalUnits: Number(totalUnits) }),
  };

  return { parsedBody, structuredImages };
}
