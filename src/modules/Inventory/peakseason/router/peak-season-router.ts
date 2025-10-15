import { Router } from "express";
import { $Enums } from "../../../../generated/prisma";
import { AuthMiddleware } from "../../../../shared/middleware/auth-middleware";
import { JWTMiddleware } from "../../../../shared/middleware/jwt-middleware";
import { RBACMiddleware } from "../../../../shared/middleware/rbac-middleware";
import { validate } from "../../../../shared/middleware/validate-middleware";
import { PeakSeasonController } from "../controllers/peak-season-controller";
import {
  createPeakSeasonValidator,
  updatePeakSeasonValidator,
} from "../validators/peak-season-validators";

export class PeakSeasonRouter {
  private router = Router();
  private controller = new PeakSeasonController();
  private authMiddleware = new AuthMiddleware();
  private jwtMiddleware = new JWTMiddleware();
  private rbacMiddleware = new RBACMiddleware();

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
