import { Request, Response } from "express";
import { errHandle } from "../../../../shared/helpers/err-handler";
import { safeNumber } from "../../../../shared/helpers/query-parser";
import { succHandle } from "../../../../shared/helpers/succ-handler";
import { RoomService } from "../services/room-service";

export class RoomController {
  private roomService = new RoomService();

  public create = async (req: Request, res: Response) => {
    try {
      const tenantId = (req as any).user.id;
      const propertyId = Number(req.params.propertyId);
      const files = req.files as Express.Multer.File[];

      const metadataRaw = req.body.imageMeta
        ? JSON.parse(req.body.imageMeta)
        : [];
      const mergedFiles = files.map((file, i) => ({
        file,
        ...metadataRaw[i],
        isPrimary: metadataRaw[i]?.isPrimary ?? i === 0,
        order: metadataRaw[i]?.order ?? i,
        altText: metadataRaw[i]?.altText ?? "",
      }));

      const payload = {
        propertyId,
        name: req.body.name,
        capacity: Number(req.body.capacity),
        basePrice: Number(req.body.basePrice),
        totalUnits: Number(req.body.totalUnits),
        description: req.body.description,
      };

      const newRoom = await this.roomService.create(
        tenantId,
        payload,
        mergedFiles
      );
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

      const files = (req.files as Express.Multer.File[] | undefined) || [];

      let mergedFiles: any[] | undefined = undefined;

      if (files.length > 0) {
        const metadataRaw = req.body.imageMeta
          ? JSON.parse(req.body.imageMeta)
          : [];

        mergedFiles = files.map((file, i) => ({
          file,
          ...metadataRaw[i],
          isPrimary: metadataRaw[i]?.isPrimary ?? i === 0,
          order: metadataRaw[i]?.order ?? i,
          altText: metadataRaw[i]?.altText ?? "",
        }));
      }

      const payload = {
        name: req.body.name,
        capacity: Number(req.body.capacity),
        basePrice: Number(req.body.basePrice),
        totalUnits: Number(req.body.totalUnits),
        description: req.body.description,
      };

      const updatedRoom = await this.roomService.updateRoom(
        tenantId,
        propertyId,
        roomId,
        payload,
        mergedFiles
      );
      succHandle(res, "Room updated successfully", updatedRoom, 200);
    } catch (error) {
      errHandle(res, "Failed to update room", 500, (error as Error).message);
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
