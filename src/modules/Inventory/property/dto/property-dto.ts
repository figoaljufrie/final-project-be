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
  altText?: string | null;
  isPrimary: boolean;
  order: number;
  publicId?: string | null;
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
  city?: string | undefined; // ✅ Add city filter
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
// ✅ Updated to include all location fields
export interface PropertyListItemDto {
  id: number;
  tenantId: number;
  name: string;
  slug: string;
  description: string | null;
  address: string | null;
  city: string | null;
  province: string | null;
  latitude: number | null;
  longitude: number | null;
  published: boolean;
  category: $Enums.PropertyCategory;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  minBasePrice: number | null;
  avgRating: number | null;
  rooms: RoomForPricing[];
  images: PropertyImageDto[];
}

// ✅ Updated SearchResultDto to include location data
export interface SearchResultDto {
  properties: Array<{
    id: number;
    name: string;
    city: string | null;
    province: string | null;
    address: string | null;
    latitude: number | null;
    longitude: number | null;
    category: $Enums.PropertyCategory;
    minPrice: number | null;
    images: PropertyImageDto[];
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ✅ Add DTO for nearby properties
export interface NearbyPropertyDto {
  id: number;
  name: string;
  city: string | null;
  province: string | null;
  address: string | null;
  latitude: number;
  longitude: number;
  category: $Enums.PropertyCategory;
  distance: number;
  minPrice: number | null;
  images: PropertyImageDto[];
}