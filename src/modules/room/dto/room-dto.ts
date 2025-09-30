export interface CreateRoomDTO {
  propertyId: number;
  name: string;
  capacity: number;
  basePrice: number;
  description?: string | null;
  totalUnits?: number;
}
