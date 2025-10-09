import { $Enums, Property } from "../../../../generated/prisma";

export enum PriceSort {
  ASC = "asc",
  DESC = "desc",
}

export enum PropertySortField {
  NAME = "name",
  CREATED_AT = "createdAt",
  PRICE = "price",
}

export interface PropertyImageDto {
  url: string;
  publicId: string;
  altText?: string;
  isPrimary: boolean;
  order: number;
}

// DTO for data passed to repository's create function
export interface PropertyCreateRepoDto {
  name: string;
  slug: string;
  description: string;
  category: $Enums.PropertyCategory;
  tenant: {
    connect: { id: number };
  };
}

// DTO for data received by service's create method
export interface CreatePropertyDto {
  name: string;
  description: string;
  category: string;
  images?: PropertyImageDto[];
}

// DTO for data passed to repository's update function
export interface PropertyUpdateRepoDto {
  name?: string;
  slug?: string;
  description?: string;
  category?: $Enums.PropertyCategory;
  city?: string;
  address?: string;
}

// DTO for data received by service's update method
export interface UpdatePropertyDto {
  name?: string;
  description?: string;
  category?: string;
  city?: string;
  address?: string;
  images?: PropertyImageDto[];
}

export interface PropertySearchQueryDto {
  page?: number | undefined;
  limit?: number | undefined;
  name?: string | undefined;
  category?: $Enums.PropertyCategory | undefined;
  sortBy?: PropertySortField | undefined;
  sortOrder?: PriceSort | undefined;
  checkInDate?: Date | undefined;
  checkOutDate?: Date | undefined;
}

export interface PropertySearchRepoParamsDto {
  whereClause: any;
  skip: number;
  take: number;
  sortBy?: "name" | "createdAt";
  sortOrder?: "asc" | "desc";
}

interface RoomForPricing {
  id: number;
  basePrice: number;
}

export interface PropertyListItemDto extends Omit<Property, "rooms"> {
  minBasePrice: number | null;
  images: { url: string }[];
  rooms: RoomForPricing[];
}
