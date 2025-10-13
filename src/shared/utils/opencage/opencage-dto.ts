export interface OpenCageGeoDTO {
  latitude: number;
  longitude: number;
  formattedAddress: string;
  city?: string;
  province?: string;
  country?: string;
}