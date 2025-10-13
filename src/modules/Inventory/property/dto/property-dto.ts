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
  province?: string;
  latitude?: number;
  longitude?: number;
}

// DTO for data received by service's update method
export interface UpdatePropertyDto {
  name?: string;
  description?: string;
  category?: string;
  city?: string;
  address?: string;
  province?: string;
  latitude?: number;
  longitude?: number;
  images?: PropertyImageDto[];
}

// query parameters for property search
export interface PropertySearchQueryDto {
  page?: number | undefined;
  limit?: number | undefined;
  checkInDate?: Date | undefined;
  checkOutDate?: Date | undefined;
  name?: string | undefined;
  category?: $Enums.PropertyCategory | undefined;
  sortBy?: PropertySortField | undefined;
  sortOrder?: PriceSort | undefined;
}

// repository parameters
export interface PropertySearchRepoParamsDto {
  whereClause: any;
  skip: number;
  take: number;
  sortBy?: "name" | "createdAt";
  sortOrder?: "asc" | "desc";
}

// simplified room representation for pricing
export interface RoomForPricing {
  id: number;
  basePrice: number;
}

// individual review subset for average calculation
export interface ReviewForSummary {
  rating: number;
}

// DTO for frontend consumption (list item)
export interface PropertyListItemDto
  extends Omit<Property, "rooms" | "reviews" | "images"> {
  minBasePrice: number | null;
  avgRating: number | null;
  rooms: RoomForPricing[];
  images: PropertyImageDto[];
}
