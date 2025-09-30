// src/modules/availability/routes/availability-router.ts
import { Router } from "express";
import { $Enums } from "../../../generated/prisma";
import { AuthMiddleware } from "../../../shared/middleware/auth-middleware";
import { JWTMiddleware } from "../../../shared/middleware/jwt-middleware";
import { RBACMiddleware } from "../../../shared/middleware/rbac-middleware";
import { AvailabilityController } from "../controllers/availability-controller";

export class AvailabilityRouter {
  private router = Router();
  private availabilityController = new AvailabilityController();
  private authMiddleware = new AuthMiddleware();
  private jwtMiddleware = new JWTMiddleware();
  private rbacMiddleware = new RBACMiddleware();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    // tenant sets availability
    this.router.post(
      "/availability",
      this.jwtMiddleware.verifyToken,
      this.authMiddleware.authenticate,
      this.rbacMiddleware.checkRole([$Enums.UserRole.tenant]),
      this.availabilityController.set
    );

    // public read endpoints
    this.router.get(
      "/rooms/:roomId/availability",
      this.availabilityController.getRange
    );
    this.router.get(
      "/rooms/:roomId/availability/day",
      this.availabilityController.getByDate
    );
  }

  public getRouter() {
    return this.router;
  }
}
