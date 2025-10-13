import { Request, Response } from "express";
import { errHandle } from "../../../../../shared/helpers/err-handler";
import {
  safeDate,
  safeNumber,
} from "../../../../../shared/helpers/query-parser";
import { succHandle } from "../../../../../shared/helpers/succ-handler";
import { PropertyDetailsService } from "../../services/features/property-detail";

export class PropertyDetailController {
  private propertyService = new PropertyDetailsService();

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
}
