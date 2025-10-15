import { RoomAvailability } from "../../../../generated/prisma";
import { CalculatedPrice } from "../../../../shared/helpers/price-calc";

export interface SetAvailabilityBodyDto {
  date: string;
  isAvailable?: boolean;
  customPrice?: number;
  priceModifier?: number;
  reason?: string;
  bookedUnits: number;
}

export interface SetAvailabilityRepoDto {
  roomId: number;
  date: Date;
  isAvailable?: boolean | undefined;
  customPrice?: number | undefined;
  bookedUnits?: number | undefined;
  priceModifier?: number | undefined;
  reason?: string | undefined;
}

export interface AvailabilitySeedDto {
  roomId: number;
  date: Date;
  isAvailable: boolean;
  bookedUnits: number;
  customPrice: number | null;
  totalUnits: number;
}

export interface RoomForPricing {
  id: number;
  propertyId: number;
  basePrice: number;
  totalUnits: number;
}

export interface PriceCalculationResult {
  priceModifier: number | null;
  customPrice: number | null;
  reason: string | null;
}

export type RoomAvailabilityDto = RoomAvailability;
export type CalculatedPriceDto = CalculatedPrice;
