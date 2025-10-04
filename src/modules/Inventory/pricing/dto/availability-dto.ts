import {
  $Enums,
  PeakSeason,
  RoomAvailability
} from "../../../../generated/prisma";
import { CalculatedPrice } from "../../../../shared/helpers/price-calc";

// --- AVAILABILITY DTOs (RoomAvailability) ---

export interface SetAvailabilityBodyDto {
  date: string;
  isAvailable?: boolean;
  customPrice?: number;
  priceModifier?: number;
  reason?: string;
}

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

// --- PEAK SEASON DTO ---

export interface CreatePeakSeasonDto {
  name: string;
  startDate: string;
  endDate: string;
  changeType: $Enums.PriceChangeType;
  changeValue: number;
  applyToAllProperties: boolean;
  propertyIds?: number[];
}

export interface PeakSeasonRepoCreateDto {
  tenantId: number;
  name: string;
  startDate: Date;
  endDate: Date;
  changeType: $Enums.PriceChangeType;
  changeValue: number;
  applyToAllProperties: boolean;
  propertyIds: number[];
}

export interface UpdatePeakSeasonDto extends Partial<CreatePeakSeasonDto> {}

export type RoomAvailabilityDto = RoomAvailability;
export type PeakSeasonDto = PeakSeason;
export type CalculatedPriceDto = CalculatedPrice;
