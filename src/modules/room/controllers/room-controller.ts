import { Request, Response } from "express";
import { errHandle } from "../../../shared/helpers/err-handler";
import { succHandle } from "../../../shared/helpers/succ-handler";
import { RoomService } from "../services/room-service";
import { parseAndValidateRoomCreation } from "../helpers/room-helpers";
import { CreateRoomDto } from "../dto/room-dto";
import { safeNumber } from "../../../shared/helpers/property/query-parser";

export class RoomController {
  private roomService = new RoomService();

  public create = async (req: Request, res: Response) => {
    try {
      const tenantId = (req as any).user.id;
      const propertyId = safeNumber(req.params.propertyId);
      if (!propertyId) throw new Error("Invalid property ID.");

      const { parsedBody, structuredImages } = parseAndValidateRoomCreation(req);

      const roomPayload: CreateRoomDto = {
        propertyId: propertyId,
        name: parsedBody.name,
        capacity: parsedBody.capacity,
        basePrice: parsedBody.basePrice,
        description: parsedBody.description,
        totalUnits: parsedBody.totalUnits,
        images: structuredImages,
      };

      const result = await this.roomService.create(tenantId, roomPayload);
      succHandle(res, "Room Created", result, 201);
    } catch (error) {
      errHandle(res, "Failed to create room", 400, (error as Error).message);
    }
  };

  public update = async (req: Request, res: Response) => {
    try {
      const propertyId = safeNumber(req.params.propertyId);
      const roomId = safeNumber(req.params.roomId);
      if (!propertyId || !roomId) throw new Error("Invalid ID parameters.");

      const result = await this.roomService.updateRoom(
        roomId,
        propertyId,
        req.body
      );
      succHandle(res, "Room updated", result, 200);
    } catch (error) {
      errHandle(res, "Failed to update Room", 400, (error as Error).message);
    }
  };

  public delete = async (req: Request, res: Response) => {
    try {
      const propertyId = safeNumber(req.params.propertyId);
      const roomId = safeNumber(req.params.roomId);
      if (!propertyId || !roomId) throw new Error("Invalid ID parameters.");

      const result = await this.roomService.deleteRoom(roomId, propertyId);
      succHandle(res, "Room successfully deleted", result, 200);
    } catch (error) {
      errHandle(res, "Failed to delete Room", 400, (error as Error).message);
    }
  };

  public listByProperty = async (req: Request, res: Response) => {
    try {
      const propertyId = safeNumber(req.params.propertyId);
      if (!propertyId) throw new Error("Invalid property ID.");

      const result = await this.roomService.getRoomsByProperty(propertyId);
      succHandle(res, "Rooms fetched", result, 200);
    } catch (error) {
      errHandle(res, "Failed to fetch rooms", 400, (error as Error).message);
    }
  };
}