import { Router } from "express";
import { $Enums } from "../../../generated/prisma";
import { AuthMiddleware } from "../../../shared/middleware/auth-middleware";
import { JWTMiddleware } from "../../../shared/middleware/jwt-middleware";
import { RBACMiddleware } from "../../../shared/middleware/rbac-middleware";
import { RoomController } from "../controllers/room-controller";

export class RoomRouter {
  private router = Router();
  private roomController = new RoomController();
  private authMiddleware = new AuthMiddleware();
  private jwtMiddleware = new JWTMiddleware();
  private rbacMiddleware = new RBACMiddleware();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post(
      "/rooms",
      this.jwtMiddleware.verifyToken,
      this.authMiddleware.authenticate,
      this.rbacMiddleware.checkRole([$Enums.UserRole.tenant]),
      this.roomController.create
    );

    this.router.get(
      "properties/:propertyId/rooms",
      this.roomController.listByProperty
    );

    this.router.patch(
      "/rooms/:id",
      this.jwtMiddleware.verifyToken,
      this.authMiddleware.authenticate,
      this.rbacMiddleware.checkRole([$Enums.UserRole.tenant])
    );

    this.router.delete(
      "/rooms/:id",
      this.jwtMiddleware.verifyToken,
      this.authMiddleware.authenticate,
      this.rbacMiddleware.checkRole([$Enums.UserRole.tenant]),
      this.roomController.delete
    );
  }

  public getRouter() {
    return this.router;
  }
}
