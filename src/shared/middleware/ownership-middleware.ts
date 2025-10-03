// shared/middleware/ownership-middleware.ts
import { NextFunction, Request, Response } from "express";
import { PropertyRepository } from "../../modules/property/repository/property-repository";
import { RoomRepository } from "../../modules/room/repository/room-repository";
import { errHandle } from "../helpers/err-handler";

export class OwnershipMiddleware {
  private propertyRepository = new PropertyRepository();
  private roomRepository = new RoomRepository();

  public checkPropertyOwnership = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const tenantId = (req as any).user.id;
      const propertyId = Number(req.params.propertyId);

      if (isNaN(propertyId)) {
        return errHandle(res, "Invalid property ID format.", 400);
      }

      const property = await this.propertyRepository.findById(propertyId);

      if (!property) {
        return errHandle(res, "Property not found for ownership check.", 404);
      }

      if (property.tenantId !== tenantId) {
        return errHandle(
          res,
          "Not Authorized: Property ownership required.",
          403
        );
      }

      next();
    } catch (error) {
      console.error("Ownership Middleware Error:", error);

      return errHandle(
        res,
        "Internal Server Error during ownership check.",
        500,
        error
      );
    }
  };

  public checkRoomOwnership = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const tenantId = (req as any).user.id;
      const roomId = Number(req.params.roomId || req.body.roomId);

      if (isNaN(roomId)) {
        return errHandle(res, "Invalid room ID format.", 400);
      }

      const roomCheckResult = await this.roomRepository.findPropertyId(roomId);

      if (!roomCheckResult) {
        return errHandle(res, "Room not found for ownership check.", 404);
      }
      const propertyId = roomCheckResult.propertyId;

      const property = await this.propertyRepository.findById(propertyId);

      if (!property || property.tenantId !== tenantId) {
        return errHandle(res, "Not Authorized: Room ownership required.", 403);
      }

      (req as any).propertyId = propertyId;

      next();
    } catch (error) {
      console.error("Room Ownership Middleware Error:", error);

      return errHandle(
        res,
        "Internal Server Error during room ownership check.",
        500,
        error
      );
    }
  };
}
