import { Router } from "express";
import { $Enums } from "../../../generated/prisma";
import { AuthMiddleware } from "../../../shared/middleware/auth-middleware";
import { JWTMiddleware } from "../../../shared/middleware/jwt-middleware";
import { OwnershipMiddleware } from "../../../shared/middleware/ownership-middleware";
import { RBACMiddleware } from "../../../shared/middleware/rbac-middleware";
import { RoomController } from "../controllers/room-controller";

export class RoomRouter {
  private router = Router();
  private roomController = new RoomController();
  private authMiddleware = new AuthMiddleware();
  private jwtMiddleware = new JWTMiddleware();
  private rbacMiddleware = new RBACMiddleware();
  private ownershipMiddleware = new OwnershipMiddleware();

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
      this.roomController.create
    );

    this.router.get(
      "/properties/:propertyId/rooms",
      this.roomController.listByProperty
    );

    this.router.patch(
      "/properties/:propertyId/rooms/:roomId",
      ...tenantAccess,
      this.ownershipMiddleware.checkPropertyOwnership,
      this.roomController.update
    );

    this.router.delete(
      "/properties/:propertyId/rooms/:roomId",
      ...tenantAccess,
      this.ownershipMiddleware.checkPropertyOwnership,
      this.roomController.delete
    );
  }

  public getRouter() {
    return this.router;
  }
}
