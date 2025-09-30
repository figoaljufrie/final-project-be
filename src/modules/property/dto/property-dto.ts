import { $Enums } from "../../../generated/prisma";

export interface CreateRoomInput {
  name: string;
  capacity: number;
  basePrice: number;
  description?: string | null;
  totalUnits?: number;
  availability?: {
    date: string; // YYYY-MM-DD
    isAvailable?: boolean;
    customPrice?: number | null;
    priceModifier?: number | null;
    reason?: string | null;
  }[];
}

export interface CreatePropertyDTO {
  category: $Enums.PropertyCategory;
  name: string;
  slug?: string;
  description?: string | null;
  address?: string | null;
  city?: string | null;
  province?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  published?: boolean;
  images?: { url: string; altText?: string | null; isPrimary?: boolean }[];
  rooms?: CreateRoomInput[];
}
