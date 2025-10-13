import { Request, Response } from "express";
import { errHandle } from "../../../../../shared/helpers/err-handler";
import { safeNumber } from "../../../../../shared/helpers/query-parser";
import { succHandle } from "../../../../../shared/helpers/succ-handler";
import { CreatePropertyDto } from "../../dto/property-dto";
import { PropertyCoreService } from "../../services/core/property-core";

export class PropertyCoreController {
  private propertyService = new PropertyCoreService();

  public create = async (req: Request, res: Response) => {
    try {
      const tenantId = (req as any).user.id;
      const payload: CreatePropertyDto = req.body;
      const files = (req.files as Express.Multer.File[] | undefined) || [];

      const mergedFiles = files.map((file, i) => ({
        file,
        isPrimary: i === 0,
        order: i,
        altText: file.originalname,
      }));

      const result = await this.propertyService.createProperty(
        tenantId,
        payload,
        mergedFiles
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
      const files = (req.files as Express.Multer.File[] | undefined) || [];

      const mergedFiles = files.map((file, i) => ({
        file,
        isPrimary: i === 0,
        order: i,
        altText: file.originalname,
      }));

      const result = await this.propertyService.updateProperty(
        tenantId,
        propertyId,
        req.body,
        mergedFiles
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

  public getTenantProperties = async (req: Request, res: Response) => {
    try {
      const tenantId = (req as any).user.id;
      const result = await this.propertyService.getPropertiesByTenant(tenantId);
      succHandle(res, "Tenant properties retrieved", result, 200);
    } catch (error) {
      errHandle(
        res,
        "Failed to retrieve tenant properties",
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
