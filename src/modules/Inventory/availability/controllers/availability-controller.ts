import { Request, Response } from "express";
import { errHandle } from "../../../../shared/helpers/err-handler";
import { safeNumber } from "../../../../shared/helpers/query-parser";
import { succHandle } from "../../../../shared/helpers/succ-handler";
import { SetAvailabilityBodyDto } from "../dto/availability-dto";
import { AvailabilityService } from "../services/availability-service";

export class AvailabilityController {
  private availabilityService = new AvailabilityService();

  public setAvailability = async (req: Request, res: Response) => {
    try {
      const roomId = safeNumber(req.params.roomId);
      if (!roomId) throw new Error("Invalid Room ID.");

      const payload: SetAvailabilityBodyDto = req.body;
      const result = await this.availabilityService.setAvailability(
        roomId,
        payload
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

  public getAvailabilityRange = async (req: Request, res: Response) => {
    try {
      const roomId = safeNumber(req.params.roomId);
      const from = new Date(req.query.from as string);
      const to = new Date(req.query.to as string);
      if (!roomId || isNaN(from.getTime()) || isNaN(to.getTime()))
        throw new Error("Invalid parameters.");

      const result = await this.availabilityService.getAvailabilityRange(
        roomId,
        from,
        to
      );
      succHandle(res, "Availability range retrieved", result, 200);
    } catch (err) {
      errHandle(res, "Failed to get availability", 400, (err as Error).message);
    }
  };

  public getAvailabilityByDate = async (req: Request, res: Response) => {
    try {
      const roomId = safeNumber(req.params.roomId);
      const date = new Date(req.query.date as string);
      if (!roomId || isNaN(date.getTime()))
        throw new Error("Invalid parameters.");

      const result = await this.availabilityService.getAvailabilityByDate(
        roomId,
        date
      );
      succHandle(res, "Availability retrieved", result, 200);
    } catch (err) {
      errHandle(res, "Failed to get availability", 400, (err as Error).message);
    }
  };
}
