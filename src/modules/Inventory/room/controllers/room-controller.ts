import { Request, Response } from "express";
import { errHandle } from "../../../../shared/helpers/err-handler";
import { safeNumber } from "../../../../shared/helpers/query-parser";
import { succHandle } from "@/shared/helpers/succ-handler";
import { RoomCoreService } from "../services/room-core";

export class RoomController {
  private roomService = new RoomCoreService();

  public create = async (req: Request, res: Response) => {
    try {
      const tenantId = (req as any).user.id;
      const propertyId = Number(req.params.propertyId);

      const payload = {
        propertyId,
        name: req.body.name,
        capacity: Number(req.body.capacity),
        basePrice: Number(req.body.basePrice),
        totalUnits: Number(req.body.totalUnits) || 1,
        description: req.body.description,
      };

      const newRoom = await this.roomService.create(tenantId, payload);
      succHandle(res, "Room created successfully", newRoom, 201);
    } catch (error) {
      errHandle(res, "Failed to create room", 500, (error as Error).message);
    }
  };

  public update = async (req: Request, res: Response) => {
    try {
      const tenantId = (req as any).user.id;
      const propertyId = Number(req.params.propertyId);
      const roomId = Number(req.params.roomId);

      const payload = {
        name: req.body.name,
        capacity: Number(req.body.capacity),
        basePrice: Number(req.body.basePrice),
        totalUnits: Number(req.body.totalUnits) || 1,
        description: req.body.description,
      };

      const updatedRoom = await this.roomService.updateRoom(
        tenantId,
        propertyId,
        roomId,
        payload
      );
      succHandle(res, "Room updated successfully", updatedRoom, 200);
    } catch (error) {
      errHandle(res, "Failed to update room", 500, (error as Error).message);
    }
  };

  public getOne = async (req: Request, res: Response) => {
    try {
      const roomId = Number(req.params.roomId);
      if (!roomId) throw new Error("Invalid room ID");

      const result = await this.roomService.getRoomById(roomId);
      succHandle(res, "Room fetched successfully", result, 200);
    } catch (error) {
      errHandle(res, "Failed to fetch room", 400, (error as Error).message);
    }
  };

  public delete = async (req: Request, res: Response) => {
    try {
      const tenantId = (req as any).user.id;
      const propertyId = safeNumber(req.params.propertyId);
      const roomId = safeNumber(req.params.roomId);
      if (!propertyId || !roomId) throw new Error("Invalid ID parameters");

      await this.roomService.deleteRoom(tenantId, propertyId, roomId);
      succHandle(res, "Room deleted successfully", null, 204);
    } catch (error) {
      errHandle(res, "Failed to delete room", 400, (error as Error).message);
    }
  };

  public listByProperty = async (req: Request, res: Response) => {
    try {
      const propertyId = safeNumber(req.params.propertyId);
      if (!propertyId) throw new Error("Invalid property ID");

      const result = await this.roomService.getRoomsByProperty(propertyId);
      succHandle(res, "Rooms fetched successfully", result, 200);
    } catch (error) {
      errHandle(res, "Failed to fetch rooms", 400, (error as Error).message);
    }
  };
}
