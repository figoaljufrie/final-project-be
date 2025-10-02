import { Request } from "express";
import { CreateRoomImagePayload } from "../dto/room-dto";

interface ImageMetadata {
  isPrimary: boolean;
  order: number;
}

interface ParsedRoomBody {
  name: string;
  capacity: number;
  basePrice: number;
  description?: string;
  totalUnits?: number;
}

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
  const files = req.files as
    | { [fieldname: string]: Express.Multer.File[] }
    | undefined;
  const imageFiles = files?.images || [];

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

  if (imageFiles.length !== imagesMetadata.length) {
    throw new Error("Image files and metadata count mismatch.");
  }

  const structuredImages: CreateRoomImagePayload[] = imageFiles.map(
    (file, index) => ({
      file,
      isPrimary: imagesMetadata[index]!.isPrimary,
      order: imagesMetadata[index]!.order,
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
