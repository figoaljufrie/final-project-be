import {
  Prisma,
  RoomAvailability,
  PeakSeason,
  $Enums,
} from "../../../generated/prisma";
import { CalculatedPrice } from "../../../shared/helpers/price-calc";

// --- AVAILABILITY DTOs (RoomAvailability) ---

export interface SetAvailabilityBodyDto {
  date: string;
  isAvailable?: boolean;
  customPrice?: number;
  priceModifier?: number;
  reason?: string;
}

// Fixed: Explicitly defining optional properties as possibly 'undefined' for TS compatibility
export interface SetAvailabilityRepoData {
  roomId: number;
  date: Date;
  isAvailable?: boolean | undefined;
  customPrice?: number | undefined;
  priceModifier?: number | undefined;
  reason?: string | undefined;
}

export interface AvailabilitySeedData {
  roomId: number;
  date: Date;
  isAvailable: boolean;
  bookedUnits: number;
  customPrice: number | null;
}

export interface RoomForPricing {
  id: number;
  propertyId: number;
  basePrice: number;
}

export interface PriceCalculationResult {
  priceModifier: number | null;
  customPrice: number | null;
  reason: string | null;
}

// --- PEAK SEASON DTOs ---

export interface CreatePeakSeasonDto {
  name: string;
  startDate: string;
  endDate: string;
  changeType: $Enums.PriceChangeType;
  changeValue: number;
  applyToAllProperties: boolean;
  propertyIds?: number[];
  priority?: number;
}

// This DTO defines the shape of the data *before* it goes to Prisma for creation.
export interface PeakSeasonRepoCreateDto {
  tenantId: number;
  name: string;
  startDate: Date;
  endDate: Date;
  changeType: $Enums.PriceChangeType;
  changeValue: number;
  applyToAllProperties: boolean;
  propertyIds: number[];
  priority: number;
}

export interface UpdatePeakSeasonDto extends Partial<CreatePeakSeasonDto> {}

export type RoomAvailabilityDto = RoomAvailability;
export type PeakSeasonDto = PeakSeason;
export type CalculatedPriceDto = CalculatedPrice;