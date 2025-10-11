import { Router } from "express";
import { $Enums } from "../../../../generated/prisma";
import { AuthMiddleware } from "../../../../shared/middleware/auth-middleware";
import { JWTMiddleware } from "../../../../shared/middleware/jwt-middleware";
import { OwnershipMiddleware } from "../../../../shared/middleware/ownership-middleware";
import { RBACMiddleware } from "../../../../shared/middleware/rbac-middleware";
import { validate } from "../../../../shared/middleware/validate-middleware";
import { PricingController } from "../controllers/pricing-controller";
import { setAvailabilityValidator } from "../validators/availability-validators";
import {
  createPeakSeasonValidator,
  updatePeakSeasonValidator,
} from "../validators/peak-season-validators";

export class PricingRouter {
  private router = Router();
  private controller = new PricingController();
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

    this.router.post(
      "/tenant/peakseasons",
      ...tenantAccess,
      validate(createPeakSeasonValidator),
      this.controller.createPeakSeason
    );

    this.router.get(
      "/tenant/peakseasons",
      ...tenantAccess,
      this.controller.listPeakSeasonsByTenant
    );

    this.router.patch(
      "/tenant/peakseasons/:id",
      ...tenantAccess,
      validate(updatePeakSeasonValidator),
      this.controller.updatePeakSeason
    );

    this.router.delete(
      "/tenant/peakseasons/:id",
      ...tenantAccess,
      this.controller.deletePeakSeason
    );

    this.router.get(
      "/properties/:propertyId/peakseasons",
      this.controller.getPeakSeasonsForPropertyRange
    );
  }

  public getRouter() {
    return this.router;
  }
}
