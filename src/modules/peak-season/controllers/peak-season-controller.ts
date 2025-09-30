// src/modules/peak-season/controllers/peakseason-controller.ts
import { Request, Response } from "express";
import { PeakSeasonService } from "../services/peakseason-service";
import { succHandle } from "../../../shared/helpers/succ-handler";
import { errHandle } from "../../../shared/helpers/err-handler";

export class PeakSeasonController {
  private service = new PeakSeasonService();

  public create = async (req: Request, res: Response) => {
    try {
      const tenantId = (req as any).user.id;
      const result = await this.service.create(tenantId, req.body);
      succHandle(res, "Peak season created", result, 201);
    } catch (err) {
      errHandle(res, "Failed to create peak season", 400, (err as Error).message);
    }
  };

  public listByTenant = async (req: Request, res: Response) => {
    try {
      const tenantId = Number(req.params.tenantId) || (req as any).user.id;
      const result = await this.service.listByTenant(tenantId);
      succHandle(res, "Peak seasons retrieved", result, 200);
    } catch (err) {
      errHandle(res, "Failed to get peak seasons", 400, (err as Error).message);
    }
  };

  public update = async (req: Request, res: Response) => {
    try {
      const tenantId = (req as any).user.id;
      const id = Number(req.params.id);
      const result = await this.service.update(tenantId, id, req.body);
      succHandle(res, "Peak season updated", result, 200);
    } catch (err) {
      errHandle(res, "Failed to update peak season", 400, (err as Error).message);
    }
  };

  public delete = async (req: Request, res: Response) => {
    try {
      const tenantId = (req as any).user.id;
      const id = Number(req.params.id);
      const result = await this.service.delete(tenantId, id);
      succHandle(res, "Peak season deleted", result, 200);
    } catch (err) {
      errHandle(res, "Failed to delete peak season", 400, (err as Error).message);
    }
  };
}