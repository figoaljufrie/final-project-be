import { Router } from "express";
import { $Enums } from "../../../../generated/prisma";
import { AuthMiddleware } from "../../../../shared/middleware/auth-middleware";
import { JWTMiddleware } from "../../../../shared/middleware/jwt-middleware";
import { OwnershipMiddleware } from "../../../../shared/middleware/ownership-middleware";
import { RBACMiddleware } from "../../../../shared/middleware/rbac-middleware";
import { PropertyController } from "../controller/property-controller";

export class PropertyRouter {
  private router = Router();
  private propertyController = new PropertyController();
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

    this.router.get(
      "/tenant/properties",
      ...tenantAccess,
      this.propertyController.getTenantProperties
    );

    this.router.get("/properties/search", this.propertyController.search);
    this.router.get("/properties/:id", this.propertyController.getDetails);
    this.router.get(
      "/properties/:id/calendar",
      this.propertyController.getCalendar
    );

    this.router.post(
      "/tenant/properties",
      ...tenantAccess,
      this.propertyController.create
    );

    this.router.patch(
      "/tenant/properties/:propertyId",
      ...tenantAccess,
      this.ownershipMiddleware.checkPropertyOwnership,
      this.propertyController.update
    );

    this.router.delete(
      "/tenant/properties/:id",
      ...tenantAccess,
      this.ownershipMiddleware.checkPropertyOwnership,
      this.propertyController.delete
    );
  }

  public getRouter() {
    return this.router;
  }
}
