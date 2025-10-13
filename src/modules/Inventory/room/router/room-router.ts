import { Router } from "express";
import { $Enums } from "../../../../generated/prisma";
import { AuthMiddleware } from "../../../../shared/middleware/auth-middleware";
import { JWTMiddleware } from "../../../../shared/middleware/jwt-middleware";
import { OwnershipMiddleware } from "../../../../shared/middleware/ownership-middleware";
import { RBACMiddleware } from "../../../../shared/middleware/rbac-middleware";
import { UploaderMiddleware } from "../../../../shared/middleware/uploader-middleware";
import { validate } from "../../../../shared/middleware/validate-middleware";
import { RoomController } from "../controllers/room-controller";
import {
  createRoomSchema,
  roomParamsSchema,
  updateRoomSchema,
} from "../validators/room-validators";

export class RoomRouter {
  private router = Router();
  private roomController = new RoomController();
  private authMiddleware = new AuthMiddleware();
  private jwtMiddleware = new JWTMiddleware();
  private rbacMiddleware = new RBACMiddleware();
  private ownershipMiddleware = new OwnershipMiddleware();
  private uploaderMiddleware = new UploaderMiddleware();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    const tenantAccess = [
      this.jwtMiddleware.verifyToken,
      this.authMiddleware.authenticate,
      this.rbacMiddleware.checkRole([$Enums.UserRole.tenant]),
    ];

    this.router.post(
      "/properties/:propertyId/rooms",
      ...tenantAccess,
      this.ownershipMiddleware.checkPropertyOwnership,
      this.uploaderMiddleware.upload().array("images", 5),
      validate(createRoomSchema),
      this.roomController.create
    );

    this.router.get(
      "/properties/:propertyId/rooms",
      // validate(roomParamsSchema),
      this.roomController.listByProperty
    );

    this.router.patch(
      "/properties/:propertyId/rooms/:roomId",
      ...tenantAccess,
      this.ownershipMiddleware.checkPropertyOwnership,
      this.uploaderMiddleware.upload().array("images", 5),
      validate(updateRoomSchema),
      this.roomController.update
    );

    this.router.delete(
      "/properties/:propertyId/rooms/:roomId",
      ...tenantAccess,
      this.ownershipMiddleware.checkPropertyOwnership,
      validate(roomParamsSchema),
      this.roomController.delete
    );
  }

  public getRouter() {
    return this.router;
  }
}
