import paginate from "../../../../shared/helpers/pagination";
import { AvailabilityService } from "../../pricing/services/availability-service";
import { PeakSeasonService } from "../../pricing/services/peak-season-service";
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
    peakSeasonService: PeakSeasonService
  ) {
    this.propertyRepository = propertyRepository;
    this.filterAndPriceService = new FilterAndPriceService(
      availabilityService,
      peakSeasonService
    );
  }

  public async executeSearch(
    params: PropertySearchQueryDto
  ): Promise<SearchResultDto> {
    const { skip, limit: take } = paginate(params.page, params.limit);

    const whereClause: any = {
      deletedAt: null,
      published: true,
      ...(params.name && {
        name: { contains: params.name, mode: "insensitive" },
      }),
      ...(params.category && { category: params.category }),
    };

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

    if (params.checkInDate && params.checkOutDate) {
      properties = await this.filterAndPriceService.filterAndPriceProperties(
        properties,
        params.checkInDate,
        params.checkOutDate
      );
    }

    if (params.sortBy === PropertySortField.PRICE) {
      properties.sort((a, b) => {
        const aPrice = a.minBasePrice ?? 0;
        const bPrice = b.minBasePrice ?? 0;
        return params.sortOrder === PriceSort.DESC
          ? bPrice - aPrice
          : aPrice - bPrice;
      });
    }

    const results = properties.map((p) => ({
      id: p.id,
      name: p.name,
      city: p.city,
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
