import { Request, Response } from "express";
import { errHandle } from "../../../../../shared/helpers/err-handler";
import { safeNumber } from "../../../../../shared/helpers/query-parser";
import { succHandle } from "../../../../../shared/helpers/succ-handler";
import { PropertyCalendarService } from "../../services/features/property-calendar";

export class PropertyCalendarController {
  private propertyService = new PropertyCalendarService();

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
}
