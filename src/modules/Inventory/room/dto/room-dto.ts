import { Prisma, Room } from "../../../../generated/prisma";

export interface CreateRoomImageMetadata {
  isPrimary: boolean;
  order: number;
}

export interface CreateRoomImagePayload extends CreateRoomImageMetadata {
  file: Express.Multer.File;
  altText: string;
}

export interface CreateRoomDto {
  propertyId: number;
  name: string;
  capacity: number;
  basePrice: number;
  description?: string | undefined;
  totalUnits?: number | undefined;
  images?: CreateRoomImagePayload[] | undefined;
}

export interface RoomCreateTxDto {
  propertyId: number;
  name: string;
  capacity: number;
  basePrice: number;
  description: string | null;
  totalUnits: number;
}

export interface RoomUpdateRepoDto extends Partial<Prisma.RoomUpdateInput> {}

export type RoomDetailDto = Room;
