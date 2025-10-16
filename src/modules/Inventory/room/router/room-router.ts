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

    // ✅ Create new room (tenant only)
    this.router.post(
      "/properties/:propertyId/rooms",
      ...tenantAccess,
      this.ownershipMiddleware.checkPropertyOwnership,
      this.uploaderMiddleware.upload().array("images", 5),
      // validate(createRoomSchema),
      this.roomController.create
    );

    // ✅ Get all rooms for a property (public)
    this.router.get(
      "/properties/:propertyId/rooms",
      // validate(roomParamsSchema),
      this.roomController.listByProperty
    );

    //get-room details (public)
    this.router.get( 
  "/properties/:propertyId/rooms/:roomId",
  // validate(roomParamsSchema), // optional
  this.roomController.getOne
);

    // ✅ Update room core info (tenant only)
    this.router.patch(
      "/properties/:propertyId/rooms/:roomId",
      ...tenantAccess,
      this.ownershipMiddleware.checkPropertyOwnership,
      this.uploaderMiddleware.upload().array("images", 5),
      // validate(updateRoomSchema),
      this.roomController.update
    );

    // ✅ Delete room (tenant only)
    this.router.delete(
      "/properties/:propertyId/rooms/:roomId",
      ...tenantAccess,
      this.ownershipMiddleware.checkPropertyOwnership,
      // validate(roomParamsSchema),
      this.roomController.delete
    );

    // ✅ NEW: Update room images only (tenant only)
    this.router.patch(
      "/properties/:propertyId/rooms/:roomId/images",
      ...tenantAccess,
      this.ownershipMiddleware.checkPropertyOwnership,
      this.uploaderMiddleware.upload().array("images", 5),
      this.roomController.updateImages
    );
  }

  public getRouter() {
    return this.router;
  }
}
