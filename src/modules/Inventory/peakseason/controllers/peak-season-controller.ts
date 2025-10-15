import { Request, Response } from "express";
import { errHandle } from "../../../../shared/helpers/err-handler";
import { safeNumber } from "../../../../shared/helpers/query-parser";
import { succHandle } from "../../../../shared/helpers/succ-handler";
import { CreatePeakSeasonDto } from "../dto/peak-season-dto";
import { PeakSeasonService } from "../services/core/peak-season-core";
import { PeakSeasonQuery } from "../services/features/peak-season-query";

export class PeakSeasonController {
  private peakSeasonService = new PeakSeasonService();
  private peakSeasonQuery = new PeakSeasonQuery()

  public createPeakSeason = async (req: Request, res: Response) => {
    try {
      const tenantId = (req as any).user.id;
      const payload: CreatePeakSeasonDto = req.body;

      const result = await this.peakSeasonService.createPeakSeason(
        tenantId,
        payload
      );
      succHandle(res, "Peak season created", result, 201);
    } catch (err) {
      errHandle(
        res,
        "Failed to create peak season",
        400,
        (err as Error).message
      );
    }
  };

  public listPeakSeasonsByTenant = async (req: Request, res: Response) => {
    try {
      const tenantId = (req as any).user.id;
      const result = await this.peakSeasonQuery.listPeakSeasonsByTenant(
        tenantId
      );
      succHandle(res, "Peak seasons retrieved", result, 200);
    } catch (err) {
      errHandle(res, "Failed to get peak seasons", 400, (err as Error).message);
    }
  };

  public updatePeakSeason = async (req: Request, res: Response) => {
    try {
      const tenantId = (req as any).user.id;
      const id = safeNumber(req.params.id);
      if (!id) throw new Error("Invalid Peak Season ID.");

      const result = await this.peakSeasonService.updatePeakSeason(
        tenantId,
        id,
        req.body
      );
      succHandle(res, "Peak season updated", result, 200);
    } catch (err) {
      errHandle(
        res,
        "Failed to update peak season",
        400,
        (err as Error).message
      );
    }
  };

  public deletePeakSeason = async (req: Request, res: Response) => {
    try {
      const tenantId = (req as any).user.id;
      const id = safeNumber(req.params.id);
      if (!id) throw new Error("Invalid Peak Season ID.");

      const result = await this.peakSeasonService.deletePeakSeason(
        tenantId,
        id
      );
      succHandle(res, "Peak season deleted", result, 200);
    } catch (err) {
      errHandle(
        res,
        "Failed to delete peak season",
        400,
        (err as Error).message
      );
    }
  };

  public getPeakSeasonsForPropertyRange = async (
    req: Request,
    res: Response
  ) => {
    try {
      const propertyId = safeNumber(req.params.propertyId);
      const start = req.query.start as string;
      const end = req.query.end as string;

      if (!propertyId) throw new Error("Invalid property ID");
      if (!start || !end) throw new Error("Start and end dates are required");

      const startDate = new Date(start);
      const endDate = new Date(end);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(0, 0, 0, 0);

      const result =
        await this.peakSeasonQuery.findPeakSeasonsForPropertyRange(
          propertyId,
          startDate,
          endDate
        );

      succHandle(res, "Peak seasons for property retrieved", result, 200);
    } catch (err) {
      errHandle(
        res,
        "Failed to get peak seasons for property",
        400,
        (err as Error).message
      );
    }
  };
}
