import { Request, Response } from "express";
import { $Enums } from "../../../../../generated/prisma";
import { errHandle } from "../../../../../shared/helpers/err-handler";
import {
  safeDate,
  safeNumber,
  safeString,
  validateEnum,
} from "../../../../../shared/helpers/query-parser";
import { succHandle } from "../../../../../shared/helpers/succ-handler";
import {
  PriceSort,
  PropertySearchQueryDto,
  PropertySortField,
} from "../../dto/property-dto";
import { PropertySearchService } from "../../services/features/property-search";

export class PropertySearchController {
  private propertyService = new PropertySearchService();

  public search = async (req: Request, res: Response) => {
    try {
      const {
        page,
        limit,
        checkInDate,
        checkOutDate,
        name,
        category,
        sortBy,
        sortOrder,
      } = req.query;

      const categoryValue = validateEnum(category, $Enums.PropertyCategory);
      const sortByValue = validateEnum(sortBy, PropertySortField);
      const sortOrderValue = validateEnum(sortOrder, PriceSort);

      const params: PropertySearchQueryDto = {
        page: safeNumber(page),
        limit: safeNumber(limit),
        checkInDate: safeDate(checkInDate),
        checkOutDate: safeDate(checkOutDate),
        name: safeString(name),
        category: categoryValue,
        sortBy: sortByValue,
        sortOrder: sortOrderValue,
      };

      const result = await this.propertyService.searchProperties(params);
      succHandle(res, "Properties retrieved", result, 200);
    } catch (error) {
      errHandle(
        res,
        "Failed to search properties",
        400,
        (error as Error).message
      );
    }
  };

  public searchNearby = async (req: Request, res: Response) => {
    try {
      const latitude = safeNumber(req.query.latitude);
      const longitude = safeNumber(req.query.longitude);
      const radius = safeNumber(req.query.radius) || 10;

      if (!latitude || !longitude) {
        return errHandle(res, "Latitude and longitude are required", 400);
      }

      const result = await this.propertyService.searchNearbyProperties(
        latitude,
        longitude,
        radius,
        20
      );

      succHandle(res, "Nearby properties retrieved", result, 200);
    } catch (error) {
      errHandle(
        res,
        "Failed to search nearby properties",
        400,
        (error as Error).message
      );
    }
  };
  public geocodeAddress = async (req: Request, res: Response) => {
    try {
      const address = safeString(req.query.address);

      if (!address) {
        return errHandle(res, "Address is required", 400);
      }

      const result = await this.propertyService.geocodeAddress(address);

      if (!result) {
        return errHandle(res, "Could not geocode address", 404);
      }

      succHandle(res, "Address geocoded successfully", result, 200);
    } catch (error) {
      errHandle(
        res,
        "Failed to geocode address",
        400,
        (error as Error).message
      );
    }
  };

  // NEW: Reverse geocode coordinates to get address
  public reverseGeocode = async (req: Request, res: Response) => {
    try {
      const latitude = safeNumber(req.query.latitude);
      const longitude = safeNumber(req.query.longitude);

      if (!latitude || !longitude) {
        return errHandle(res, "Latitude and longitude are required", 400);
      }

      const result = await this.propertyService.reverseGeocode(
        latitude,
        longitude
      );

      if (!result) {
        return errHandle(res, "Could not reverse geocode coordinates", 404);
      }

      succHandle(res, "Coordinates reverse geocoded successfully", result, 200);
    } catch (error) {
      errHandle(
        res,
        "Failed to reverse geocode",
        400,
        (error as Error).message
      );
    }
  };
}
