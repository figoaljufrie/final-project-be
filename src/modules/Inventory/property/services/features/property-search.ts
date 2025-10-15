import { OpenCageGeoDTO } from "@/shared/utils/opencage/opencage-dto";
import { OpenCageGeoService } from "../../../../../shared/utils/opencage/opencage-service";
import { AvailabilityService } from "../../../pricing/services/availability-service";
import { PeakSeasonService } from "../../../pricing/services/peak-season-service";
import {
  PropertySearchQueryDto,
  SearchResultDto,
} from "../../dto/property-dto";
import { PropertyRepository } from "../../repository/property-repository";
import { PropertySearcher } from "../../searcher/property-searcher";

export class PropertySearchService {
  private propertyRepository = new PropertyRepository();
  private availabilityService = new AvailabilityService();
  private peakSeasonService = new PeakSeasonService();
  private geocodingService = new OpenCageGeoService();

  private propertySearcher = new PropertySearcher(
    this.propertyRepository,
    this.availabilityService,
    this.peakSeasonService
  );

  public async searchProperties(
    params: PropertySearchQueryDto
  ): Promise<SearchResultDto> {
    return this.propertySearcher.search(params);
  }

  public async searchNearbyProperties(
    latitude: number,
    longitude: number,
    radiusKm = 10,
    limit = 20
  ) {
    const allProperties = await this.propertyRepository.findMany({
      where: {
        deletedAt: null,
        published: true,
        latitude: { not: null },
        longitude: { not: null },
      },
      include: {
        images: { where: { isPrimary: true }, take: 1 },
        rooms: { where: { deletedAt: null }, take: 1 },
      },
    });

    const propertiesWithDistance = allProperties
      .map((property) => {
        const distance = this.geocodingService.calculateDistance(
          latitude,
          longitude,
          property.latitude!,
          property.longitude!
        );
        return { ...property, distance: parseFloat(distance.toFixed(2)) };
      })
      .filter((p) => p.distance <= radiusKm)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, limit);

    return propertiesWithDistance;
  }
  public async geocodeAddress(address: string): Promise<OpenCageGeoDTO | null> {
    return this.geocodingService.geocodeAddress(address);
  }
  public async reverseGeocode(
    latitude: number,
    longitude: number
  ): Promise<OpenCageGeoDTO | null> {
    return this.geocodingService.reverseGeolocation(latitude, longitude);
  }
}
