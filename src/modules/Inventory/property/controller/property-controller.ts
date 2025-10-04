import { Request, Response } from "express";
import { $Enums } from "../../../../generated/prisma";
import { errHandle } from "../../../../shared/helpers/err-handler";
import {
  safeDate,
  safeNumber,
  safeString,
  validateEnum,
} from "../../../../shared/helpers/query-parser";
import { succHandle } from "../../../../shared/helpers/succ-handler";
import {
  CreatePropertyDto,
  PriceSort,
  PropertySearchQueryDto,
  PropertySortField,
} from "../dto/property-dto";
import { PropertyService } from "../services/property-service";

export class PropertyController {
  private propertyService = new PropertyService();

  public create = async (req: Request, res: Response) => {
    try {
      const tenantId = (req as any).user.id;
      const payload: CreatePropertyDto = req.body;
      const result = await this.propertyService.createProperty(
        tenantId,
        payload
      );
      succHandle(res, "Property created", result, 201);
    } catch (error) {
      errHandle(
        res,
        "Failed to create property",
        400,
        (error as Error).message
      );
    }
  };

  public update = async (req: Request, res: Response) => {
    try {
      const tenantId = (req as any).user.id;
      const propertyId = Number(req.params.propertyId);
      const result = await this.propertyService.updateProperty(
        tenantId,
        propertyId,
        req.body
      );
      succHandle(res, "Property updated", result, 200);
    } catch (error) {
      errHandle(
        res,
        "Failed to update property",
        400,
        (error as Error).message
      );
    }
  };

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

      // 2. Pass tenantId as the first argument to searchProperties
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

  public getDetails = async (req: Request, res: Response) => {
    try {
      const propertyId = safeNumber(req.params.id);
      if (!propertyId) throw new Error("Invalid property ID");

      const checkInDate = safeDate(req.query.checkInDate);
      const checkOutDate = safeDate(req.query.checkOutDate);

      const result = await this.propertyService.getPropertyDetails(
        propertyId,
        checkInDate,
        checkOutDate
      );
      succHandle(res, "Property details retrieved", result, 200);
    } catch (error) {
      errHandle(
        res,
        "Failed to get property details",
        400,
        (error as Error).message
      );
    }
  };

  public getCalendar = async (req: Request, res: Response) => {
    try {
      const propertyId = safeNumber(req.params.id);
      if (!propertyId) throw new Error("Invalid property ID");

      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();

      const month = safeNumber(req.query.month) || currentMonth;
      const year = safeNumber(req.query.year) || currentYear;

      if (month < 1 || month > 12) {
        return errHandle(res, "Invalid month or year parameters.", 400);
      }

      const result = await this.propertyService.getPropertyCalendar(
        propertyId,
        month,
        year
      );
      succHandle(res, "Property calendar retrieved", result, 200);
    } catch (error) {
      errHandle(
        res,
        "Failed to get property calendar",
        400,
        (error as Error).message
      );
    }
  };

  public delete = async (req: Request, res: Response) => {
    try {
      const propertyId = safeNumber(req.params.id);
      if (!propertyId) throw new Error("Invalid property ID");

      await this.propertyService.softDeleteProperty(propertyId);
      succHandle(res, "Property deleted successfully", null, 204);
    } catch (error) {
      errHandle(
        res,
        "Failed to delete property",
        400,
        (error as Error).message
      );
    }
  };
}
