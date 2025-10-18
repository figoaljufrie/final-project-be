import paginate from "../../../../shared/helpers/pagination";
import { AvailabilityService } from "../../availability/services/availability-service";
import { PeakSeasonQuery } from "../../peakseason/services/features/peak-season-query";
import {
  PriceSort,
  PropertySearchQueryDto,
  PropertySearchRepoParamsDto,
  PropertySortField,
  SearchResultDto,
} from "../dto/property-dto";
import { PropertyRepository } from "../repository/property-repository";
import { FilterAndPriceService } from "./filter-and-price";

export class SearchExecutor {
  private propertyRepository: PropertyRepository;
  private filterAndPriceService: FilterAndPriceService;

  constructor(
    propertyRepository: PropertyRepository,
    availabilityService: AvailabilityService,
    peakSeasonQuery: PeakSeasonQuery
  ) {
    this.propertyRepository = propertyRepository;
    this.filterAndPriceService = new FilterAndPriceService(
      availabilityService,
      peakSeasonQuery
    );
  }

  public async executeSearch(
    params: PropertySearchQueryDto
  ): Promise<SearchResultDto> {
    const { skip, limit: take } = paginate(params.page, params.limit);

    // ✅ Build where clause with city support
    const whereClause: any = {
      deletedAt: null,
      published: true,
    };

    // ✅ Search in both name and city if name is provided
    if (params.name) {
      whereClause.OR = [
        { name: { contains: params.name, mode: "insensitive" } },
        { city: { contains: params.name, mode: "insensitive" } },
        { address: { contains: params.name, mode: "insensitive" } },
      ];
    }

    // ✅ Filter by specific city if provided
    if (params.city) {
      whereClause.city = { contains: params.city, mode: "insensitive" };
    }

    // ✅ Filter by category
    if (params.category) {
      whereClause.category = params.category;
    }

    const total = await this.propertyRepository.count(whereClause);

    const sortByRepo =
      params.sortBy === PropertySortField.PRICE
        ? PropertySortField.CREATED_AT
        : params.sortBy;

    const repoParams: PropertySearchRepoParamsDto = {
      whereClause,
      skip,
      take,
      ...(params.sortOrder && { sortOrder: params.sortOrder }),
      ...(sortByRepo && { sortBy: sortByRepo as "name" | "createdAt" }),
    };

    let properties = await this.propertyRepository.findManyForSearch(
      repoParams
    );

    // Apply availability filtering if dates provided
    if (params.checkInDate && params.checkOutDate) {
      properties = await this.filterAndPriceService.filterAndPriceProperties(
        properties,
        params.checkInDate,
        params.checkOutDate
      );
    }

    // Sort by price if requested
    if (params.sortBy === PropertySortField.PRICE) {
      properties.sort((a, b) => {
        const aPrice = a.minBasePrice ?? 0;
        const bPrice = b.minBasePrice ?? 0;
        return params.sortOrder === PriceSort.DESC
          ? bPrice - aPrice
          : aPrice - bPrice;
      });
    }

    // ✅ Map results to include all location data
    const results = properties.map((p) => ({
      id: p.id,
      name: p.name,
      city: p.city,
      province: p.province,
      address: p.address,
      latitude: p.latitude,
      longitude: p.longitude,
      category: p.category,
      minPrice: p.minBasePrice,
      images: p.images || [],
    }));

    return {
      properties: results,
      pagination: {
        page: params.page || 1,
        limit: take,
        total,
        totalPages: Math.ceil(total / take),
      },
    };
  }
}
