import { Request, Response } from "express";
import { errHandle } from "../../../shared/helpers/err-handler";
import { succHandle } from "../../../shared/helpers/succ-handler";
import { RoomService } from "../services/room-service";

export class RoomController {
  private roomService: RoomService;

  constructor() {
    this.roomService = new RoomService();
  }

  public create = async (req: Request, res: Response) => {
    try {
      const tenantId = (req as any).user.id;
      const result = await this.roomService.createRoom(tenantId, req.body);
      succHandle(res, "Room Created", result, 201);
    } catch (error) {
      errHandle(res, "Failed to create room", 400, (error as Error).message);
    }
  };

  public update = async (req: Request, res: Response) => {
    try {
      const tenantId = (req as any).user.id;
      const roomId = Number(req.params.id);
      const result = await this.roomService.updateRoom(
        tenantId,
        roomId,
        req.body
      );
      succHandle(res, "Room updated", result, 200);
    } catch (error) {
      errHandle(res, "Failed to update Room", 400, (error as Error).message);
    }
  };

  public delete = async (req: Request, res: Response) => {
    try {
      const tenantId = (req as any).user.id;
      const roomId = Number(req.params.id);
      const result = await this.roomService.deleteRoom(tenantId, roomId);
      succHandle(res, "Room successfully deleted", result, 200);
    } catch (error) {
      errHandle(res, "Failed to delete Room", 400, (error as Error).message);
    }
  };

  public listByProperty = async (req: Request, res: Response) => {
    try {
      const propertyId = Number(req.params.propertyId);
      const result = await this.roomService.getRoomsByProperty(propertyId);
      succHandle(res, "Rooms fetched", result, 200);
    } catch (error) {
      errHandle(res, "Failed to fetch rooms", 400, (error as Error).message);
    }
  };
}
