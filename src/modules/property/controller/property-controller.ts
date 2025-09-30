// src/modules/property/controllers/property-controller.ts
import { Request, Response } from "express";
import { PropertyService } from "../services/property-service";
import { errHandle } from "../../../shared/helpers/err-handler";
import { succHandle } from "../../../shared/helpers/succ-handler";

export class PropertyController {
  private propertyService = new PropertyService();

  public create = async (req: Request, res: Response) => {
    try {
      const tenantId = (req as any).user.id;
      const result = await this.propertyService.createProperty(tenantId, req.body);
      succHandle(res, "Property created successfully", result, 201);
    } catch (err) {
      errHandle(res, "Failed to create property", 400, (err as Error).message);
    }
  };

  public update = async (req: Request, res: Response) => {
    try {
      const tenantId = (req as any).user.id;
      const id = Number(req.params.id);
      const result = await this.propertyService.updateProperty(tenantId, id, req.body);
      succHandle(res, "Property updated successfully", result, 200);
    } catch (err) {
      errHandle(res, "Failed to update property", 400, (err as Error).message);
    }
  };

  public publish = async (req: Request, res: Response) => {
    try {
      const tenantId = (req as any).user.id;
      const id = Number(req.params.id);
      const { publish } = req.body;
      const result = await this.propertyService.publishProperty(tenantId, id, !!publish);
      succHandle(res, "Property publish state updated", result, 200);
    } catch (err) {
      errHandle(res, "Failed to publish property", 400, (err as Error).message);
    }
  };

  public delete = async (req: Request, res: Response) => {
    try {
      const tenantId = (req as any).user.id;
      const id = Number(req.params.id);
      const result = await this.propertyService.deleteProperty(tenantId, id);
      succHandle(res, "Property deleted successfully", result, 200);
    } catch (err) {
      errHandle(res, "Failed to delete property", 400, (err as Error).message);
    }
  };

  public getById = async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const date = (req.query.date as string) || null;
      const result = await this.propertyService.getPropertyById(id, date);
      succHandle(res, "Property retrieved", result, 200);
    } catch (err) {
      errHandle(res, "Failed to get property", 404, (err as Error).message);
    }
  };

  public search = async (req: Request, res: Response) => {
    try {
      const { city, category, q, page, limit, sort, start } = req.query as any;
      const searchParams: {
        city?: string;
        category?: string;
        q?: string;
        page?: number;
        limit?: number;
        sort?: string;
        start?: string | null;
      } = {
        city: city || undefined,
        category: category || undefined,
        q: q || undefined,
        sort: sort || undefined,
        start: start ?? null,
      };
      if (page !== undefined) searchParams.page = Number(page);
      if (limit !== undefined) searchParams.limit = Number(limit);

      const result = await this.propertyService.search(searchParams);
      succHandle(res, "Search results", result, 200);
    } catch (err) {
      errHandle(res, "Failed to search properties", 400, (err as Error).message);
    }
  };

  public listTenant = async (req: Request, res: Response) => {
    try {
      const tenantId = (req as any).user.id;
      const result = await this.propertyService.listTenantProperties(tenantId);
      succHandle(res, "Tenant properties retrieved", result, 200);
    } catch (err) {
      errHandle(res, "Failed to get tenant properties", 400, (err as Error).message);
    }
  };
}