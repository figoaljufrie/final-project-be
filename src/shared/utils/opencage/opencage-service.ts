import { ApiError } from "../api-error";
import { OpenCageGeoDTO } from "./opencage-dto";

export class OpenCageGeoService {
  private apiKey: string;
  private baseUrl = "https://api.opencagedata.com/geocode/v1/json";

  constructor() {
    this.apiKey = process.env.OPENCAGE_API_KEY || "";
    if (!this.apiKey) console.warn("⚠️ OpenCage API Key not set.");
  }

  public async geocodeAddress(address: string): Promise<OpenCageGeoDTO | null> {
    if (!this.apiKey) {
      console.warn("⚠️ Cannot use geolocation, no API key provided.");
      return null;
    }

    try {
      const url = `${this.baseUrl}?q=${encodeURIComponent(address)}&key=${
        this.apiKey
      }&language=en&pretty=1`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new ApiError("OpenCage API error", response.status);
      }

      const data: any = await response.json();

      if (data.results && data.results.length > 0) {
        const result = data.results[0];
        const components = result.components;

        return {
          latitude: result.geometry.lat,
          longitude: result.geometry.lng,
          formattedAddress: result.formatted,
          city:
            components.city ||
            components.town ||
            components.village ||
            components.county ||
            undefined,
          province:
            components.state ||
            components.province ||
            components.region ||
            undefined,
          country: components.country || undefined,
        };
      }

      console.warn(`⚠️ No geolocation result for address: ${address}`);
      return null;
    } catch (error) {
      console.error("Geocoding error:", error);
      return null;
    }
  }

  public async reverseGeolocation(
    latitude: number,
    longitude: number
  ): Promise<OpenCageGeoDTO | null> {
    if (!this.apiKey) {
      console.warn("⚠️ Reverse Geolocation skipped: No API key provided.");
      return null;
    }

    try {
      const url = `${this.baseUrl}?q=${latitude}+${longitude}&key=${this.apiKey}&language=en&pretty=1`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new ApiError("OpenCage API error", response.status);
      }

      const data: any = await response.json();

      if (data.results && data.results.length > 0) {
        const result = data.results[0];
        const components = result.components;

        return {
          latitude,
          longitude,
          formattedAddress: result.formatted, // ✅ fixed
          city:
            components.city ||
            components.town ||
            components.village ||
            undefined,
          province:
            components.state ||
            components.province ||
            components.region ||
            undefined,
          country: components.country || undefined,
        };
      }

      console.warn(
        `⚠️ No reverse geocode result for coords: ${latitude}, ${longitude}`
      );
      return null; // ✅ ensure return
    } catch (error) {
      console.error("❌ Reverse Geocoding error:", error);
      return null; // ✅ ensure return
    }
  }

  /** 📏 Calculate distance in km between two coordinates (Haversine formula) */
  public calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // radius of Earth in km
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLon / 2) ** 2;

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180); 
  }
}
