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

export interface PropertyCreateRepoDto {
  name: string;
  slug: string;
  description?: string | undefined;
  category: $Enums.PropertyCategory;
  address?: string | undefined;
  city?: string | undefined;
  province?: string | undefined;
  latitude?: number | undefined;
  longitude?: number | undefined;
  tenant: {
    connect: { id: number };
  };
}

export interface CreatePropertyDto {
  name: string;
  description?: string | undefined;
  category: string;
  address?: string | undefined;
  city?: string | undefined;
  province?: string | undefined;
  images?: PropertyImageDto[];
}

export interface PropertyUpdateRepoDto {

  name?: string | undefined;
  slug?: string | undefined;
  description?: string | undefined;
  category?: $Enums.PropertyCategory | undefined;
  address?: string | undefined;
  city?: string | undefined;
  province?: string | undefined;
  latitude?: number | undefined;
  longitude?: number | undefined;
}

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

export interface SearchResultDto {
  properties: Array<{
    id: number;
    name: string;
    city: string | null;
    category: string;
    minPrice: number | null;
    image: string | undefined;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
