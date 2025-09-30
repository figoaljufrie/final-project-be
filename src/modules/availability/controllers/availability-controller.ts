// src/modules/availability/controllers/availability-controller.ts
import { Request, Response } from "express";
import { errHandle } from "../../../shared/helpers/err-handler";
import { succHandle } from "../../../shared/helpers/succ-handler";
import { AvailabilityService } from "../services/availability-service";

export class AvailabilityController {
  private availabilityService = new AvailabilityService();

  public set = async (req: Request, res: Response) => {
    try {
      const tenantId = (req as any).user.id;
      const result = await this.availabilityService.setAvailability(
        tenantId,
        req.body
      );
      succHandle(res, "Availability updated", result, 200);
    } catch (err) {
      errHandle(
        res,
        "Failed to update availability",
        400,
        (err as Error).message
      );
    }
  };

  public getRange = async (req: Request, res: Response) => {
    try {
      const roomId = Number(req.params.roomId);
      const from = new Date(req.query.from as string);
      const to = new Date(req.query.to as string);
      const result = await this.availabilityService.getAvailability(
        roomId,
        from,
        to
      );
      succHandle(res, "Availability range retrieved", result, 200);
    } catch (err) {
      errHandle(res, "Failed to get availability", 400, (err as Error).message);
    }
  };

  public getByDate = async (req: Request, res: Response) => {
    try {
      const roomId = Number(req.params.roomId);
      const date = new Date(req.query.date as string);
      const result = await this.availabilityService.getByDate(roomId, date);
      succHandle(res, "Availability retrieved", result, 200);
    } catch (err) {
      errHandle(res, "Failed to get availability", 400, (err as Error).message);
    }
  };
}
