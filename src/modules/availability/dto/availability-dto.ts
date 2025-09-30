export interface AvailabilityDTO {
  roomId: number;
  date: string;
  isAvailable?: boolean;
  customPrice?: number | null;
  priceModifier?: number | null;
  reason?: string | null;
}
