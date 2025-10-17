import { $Enums } from "../../../../../generated/prisma";
import { ApiError } from "../../../../../shared/utils/api-error";
import { OpenCageGeoService } from "../../../../../shared/utils/opencage/opencage-service";
import {
  CreatePropertyDto,
  PropertyCreateRepoDto,
  PropertyUpdateRepoDto,
  UpdatePropertyDto,
} from "../../dto/property-dto";
import { PropertyRepository } from "../../repository/property-repository";
import { PropertyCacheService } from "./property-cache";

export class PropertyCoreService {
  private propertyRepository = new PropertyRepository();
  private geocodingService = new OpenCageGeoService();
  private cacheService = new PropertyCacheService();

  public async createProperty(tenantId: number, payload: CreatePropertyDto) {
    const slug = payload.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const repoPayload: PropertyCreateRepoDto = {
      name: payload.name,
      slug,
      description: payload.description,
      category: payload.category as $Enums.PropertyCategory,
      address: payload.address,
      city: payload.city,
      province: payload.province,
      tenant: { connect: { id: tenantId } },
    };

    if (payload.address || (payload.city && payload.province)) {
      const addressString =
        payload.address || `${payload.city}, ${payload.province}, Indonesia`;
      const geocodeResult = await this.geocodingService.geocodeAddress(
        addressString
      );

      if (geocodeResult) {
        repoPayload.latitude = geocodeResult.latitude;
        repoPayload.longitude = geocodeResult.longitude;

        if (!payload.city && geocodeResult.city)
          repoPayload.city = geocodeResult.city;
        if (!payload.province && geocodeResult.province)
          repoPayload.province = geocodeResult.province;

        console.log(
          `✅ Geocoded property: ${geocodeResult.latitude}, ${geocodeResult.longitude}`
        );
      }
    }

    const property = await this.propertyRepository.create(repoPayload);

    await this.cacheService.invalidatePropertyCaches(property.id);

    return this.propertyRepository.findById(property.id);
  }

  public async updateProperty(
    tenantId: number,
    propertyId: number,
    data: UpdatePropertyDto
  ) {
    const existing = await this.propertyRepository.findById(propertyId);
    if (!existing) throw new ApiError("Property not found", 404);
    if (existing.tenantId !== tenantId)
      throw new ApiError("Not Authorized", 403);

    const { category, ...rest } = data;
    const updateData: Partial<PropertyUpdateRepoDto> = {
      ...rest,
      ...(category && { category: category as $Enums.PropertyCategory }),
    };

    if (data.name && data.name !== existing.name) {
      updateData.slug = data.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
    }

    const addressChanged =
      data.address !== existing.address ||
      data.city !== existing.city ||
      data.province !== existing.province;

    if (addressChanged && (data.address || (data.city && data.province))) {
      const addressString =
        data.address ||
        `${data.city || existing.city}, ${
          data.province || existing.province
        }, Indonesia`;
      const geocodeResult = await this.geocodingService.geocodeAddress(
        addressString
      );

      if (geocodeResult) {
        updateData.latitude = geocodeResult.latitude;
        updateData.longitude = geocodeResult.longitude;
        console.log(
          `✅ Re-geocoded property: ${geocodeResult.latitude}, ${geocodeResult.longitude}`
        );
      }
    }

    await this.propertyRepository.update(propertyId, updateData);

    await this.cacheService.invalidatePropertyCaches(propertyId);
    const updated = await this.propertyRepository.findById(propertyId);
    if (!updated)
      throw new ApiError("Failed to retrieve updated property", 500);
    return updated;
  }

  public async softDeleteProperty(propertyId: number) {
    const result = await this.propertyRepository.softDelete(propertyId);
    await this.cacheService.invalidatePropertyCaches(propertyId);
    return result;
  }

  public async getPropertiesByTenant(tenantId: number) {
    return this.propertyRepository.findByTenant(tenantId);
  }
}
