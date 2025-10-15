import { Router } from "express";
import { $Enums } from "../../../../generated/prisma";
import { AuthMiddleware } from "../../../../shared/middleware/auth-middleware";
import { JWTMiddleware } from "../../../../shared/middleware/jwt-middleware";
import { OwnershipMiddleware } from "../../../../shared/middleware/ownership-middleware";
import { RBACMiddleware } from "../../../../shared/middleware/rbac-middleware";
import { validate } from "../../../../shared/middleware/validate-middleware";
import { AvailabilityController } from "../controllers/availability-controller";
import { setAvailabilityValidator } from "../validators/availability-validators";

export class AvailabilityRouter {
  private router = Router();
  private controller = new AvailabilityController();
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
      "/properties/:propertyId/rooms/:roomId/availability",
      ...tenantAccess,
      this.ownershipMiddleware.checkRoomOwnership,
      validate(setAvailabilityValidator),
      this.controller.setAvailability
    );

    this.router.get(
      "/properties/:propertyId/rooms/:roomId/availability",
      this.controller.getAvailabilityRange
    );

    this.router.get(
      "/properties/:propertyId/rooms/:roomId/availability/day",
      this.controller.getAvailabilityByDate
    );
  }

  public getRouter() {
    return this.router;
  }
}
