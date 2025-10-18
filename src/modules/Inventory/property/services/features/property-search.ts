// In your PropertySearchService

import { PeakSeasonQuery } from "@/modules/Inventory/peakseason/services/features/peak-season-query";
import { OpenCageGeoDTO } from "@/shared/utils/opencage/opencage-dto";
import { OpenCageGeoService } from "../../../../../shared/utils/opencage/opencage-service";
import { AvailabilityService } from "../../../availability/services/availability-service";
import {
  NearbyPropertyDto,
  PropertySearchQueryDto,
  SearchResultDto,
} from "../../dto/property-dto";
import { PropertyRepository } from "../../repository/property-repository";
import { PropertySearcher } from "../../searcher/property-searcher";

export class PropertySearchService {
  private propertyRepository = new PropertyRepository();
  private availabilityService = new AvailabilityService();
  private peakSeasonQuery = new PeakSeasonQuery();
  private geocodingService = new OpenCageGeoService();

  private propertySearcher = new PropertySearcher(
    this.propertyRepository,
    this.availabilityService,
    this.peakSeasonQuery
  );

  public async searchProperties(
    params: PropertySearchQueryDto
  ): Promise<SearchResultDto> {
    return this.propertySearcher.search(params);
  }

  // ✅ Fixed searchNearbyProperties using findManyForSearch
  public async searchNearbyProperties(
    latitude: number,
    longitude: number,
    radiusKm = 10,
    limit = 20
  ): Promise<NearbyPropertyDto[]> {
    // Use findManyForSearch to get strong typing with rooms & images
    const allProperties = await this.propertyRepository.findManyForSearch({
      whereClause: {
        deletedAt: null,
        published: true,
        latitude: { not: null },
        longitude: { not: null },
      },
      skip: 0,
      take: 1000, // large enough to filter later
      sortBy: "createdAt",
      sortOrder: "desc",
    });

    const propertiesWithDistance: NearbyPropertyDto[] = allProperties
      .map((property) => {
        const distance = this.geocodingService.calculateDistance(
          latitude,
          longitude,
          property.latitude!,
          property.longitude!
        );

        return {
          id: property.id,
          name: property.name,
          city: property.city,
          province: property.province,
          address: property.address,
          latitude: property.latitude!,
          longitude: property.longitude!,
          category: property.category,
          distance: parseFloat(distance.toFixed(2)),
          minPrice: property.rooms[0]?.basePrice ?? null,
          images: property.images || [],
        };
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
