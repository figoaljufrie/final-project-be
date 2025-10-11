import crypto from "crypto";
import { PropertySearchQueryDto } from "../../modules/Inventory/property/dto/property-dto";

/**
 * Generates consistent cache keys for different operations
 */
export class CacheKeys {
  private static readonly PREFIX = "property_mgmt";

  /**
   * Generate hash from object for consistent key generation
   */
  private static hashObject(obj: any): string {
    const str = JSON.stringify(obj, Object.keys(obj).sort());
    return crypto.createHash("md5").update(str).digest("hex").substring(0, 8);
  }

  /**
   * Property search cache key
   * Pattern: property_mgmt:search:{hash}
   */
  static search(params: PropertySearchQueryDto): string {
    const normalized = {
      page: params.page || 1,
      limit: params.limit || 10,
      category: params.category || null,
      name: params.name || null,
      sortBy: params.sortBy || "createdAt",
      sortOrder: params.sortOrder || "desc",
      checkInDate: params.checkInDate?.toISOString().split("T")[0] || null,
      checkOutDate: params.checkOutDate?.toISOString().split("T")[0] || null,
    };

    const hash = this.hashObject(normalized);
    return `${this.PREFIX}:search:${hash}`;
  }

  /**
   * Property details cache key
   * Pattern: property_mgmt:property:{propertyId}:details
   */
  static propertyDetails(propertyId: number, checkInDate?: Date, checkOutDate?: Date): string {
    if (checkInDate && checkOutDate) {
      const checkIn = checkInDate.toISOString().split("T")[0];
      const checkOut = checkOutDate.toISOString().split("T")[0];
      return `${this.PREFIX}:property:${propertyId}:details:${checkIn}:${checkOut}`;
    }
    return `${this.PREFIX}:property:${propertyId}:details`;
  }

  /**
   * Property calendar cache key
   * Pattern: property_mgmt:property:{propertyId}:calendar:{month}:{year}
   */
  static propertyCalendar(propertyId: number, month: number, year: number): string {
    return `${this.PREFIX}:property:${propertyId}:calendar:${year}:${month}`;
  }

  /**
   * Availability bulk cache key
   * Pattern: property_mgmt:availability:bulk:{roomIdsHash}:{dateHash}
   */
  static availabilityBulk(roomIds: number[], from: Date, to: Date): string {
    const roomsHash = this.hashObject(roomIds.sort());
    const dateHash = this.hashObject({
      from: from.toISOString().split("T")[0],
      to: to.toISOString().split("T")[0],
    });
    return `${this.PREFIX}:availability:bulk:${roomsHash}:${dateHash}`;
  }

  /**
   * Peak seasons cache key
   * Pattern: property_mgmt:peakseasons:tenant:{tenantId}
   */
  static peakSeasonsTenant(tenantId: number): string {
    return `${this.PREFIX}:peakseasons:tenant:${tenantId}`;
  }

  /**
   * Peak seasons for property range
   * Pattern: property_mgmt:peakseasons:property:{propertyId}:{startDate}:{endDate}
   */
  static peakSeasonsPropertyRange(
    propertyId: number,
    startDate: Date,
    endDate: Date
  ): string {
    const start = startDate.toISOString().split("T")[0];
    const end = endDate.toISOString().split("T")[0];
    return `${this.PREFIX}:peakseasons:property:${propertyId}:${start}:${end}`;
  }

  /**
   * Rooms by property cache key
   * Pattern: property_mgmt:rooms:property:{propertyId}
   */
  static roomsByProperty(propertyId: number): string {
    return `${this.PREFIX}:rooms:property:${propertyId}`;
  }

  /**
   * Invalidation patterns
   */
  static patterns = {
    allPropertyCache: (propertyId: number) => 
      `${this.PREFIX}:property:${propertyId}:*`,
    
    allSearchCache: () => 
      `${this.PREFIX}:search:*`,
    
    allCalendarCache: (propertyId: number) => 
      `${this.PREFIX}:property:${propertyId}:calendar:*`,
    
    allAvailabilityCache: () => 
      `${this.PREFIX}:availability:*`,
    
    allPeakSeasonsCache: (tenantId?: number) => 
      tenantId 
        ? `${this.PREFIX}:peakseasons:tenant:${tenantId}:*`
        : `${this.PREFIX}:peakseasons:*`,
  };
}