// src/modules/property/routes/property-router.ts
import { Router } from "express";
import { $Enums } from "../../../generated/prisma";
import { AuthMiddleware } from "../../../shared/middleware/auth-middleware";
import { JWTMiddleware } from "../../../shared/middleware/jwt-middleware";
import { RBACMiddleware } from "../../../shared/middleware/rbac-middleware";
import { PropertyController } from "../controller/property-controller";

export class PropertyRouter {
  private router = Router();
  private propertyController = new PropertyController();
  private authMiddleware = new AuthMiddleware();
  private jwtMiddleware = new JWTMiddleware();
  private rbacMiddleware = new RBACMiddleware();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    // public search & detail
    this.router.get("/properties", this.propertyController.search);
    this.router.get("/properties/:id", this.propertyController.getById);

    // tenant-only
    this.router.post(
      "/properties",
      this.jwtMiddleware.verifyToken,
      this.authMiddleware.authenticate,
      this.rbacMiddleware.checkRole([$Enums.UserRole.tenant]),
      this.propertyController.create
    );

    this.router.get(
      "/properties/tenant/me",
      this.jwtMiddleware.verifyToken,
      this.authMiddleware.authenticate,
      this.rbacMiddleware.checkRole([$Enums.UserRole.tenant]),
      this.propertyController.listTenant
    );

    this.router.patch(
      "/properties/:id",
      this.jwtMiddleware.verifyToken,
      this.authMiddleware.authenticate,
      this.rbacMiddleware.checkRole([$Enums.UserRole.tenant]),
      this.propertyController.update
    );

    this.router.patch(
      "/properties/:id/publish",
      this.jwtMiddleware.verifyToken,
      this.authMiddleware.authenticate,
      this.rbacMiddleware.checkRole([$Enums.UserRole.tenant]),
      this.propertyController.publish
    );

    this.router.delete(
      "/properties/:id",
      this.jwtMiddleware.verifyToken,
      this.authMiddleware.authenticate,
      this.rbacMiddleware.checkRole([$Enums.UserRole.tenant]),
      this.propertyController.delete
    );
  }

  public getRouter() {
    return this.router;
  }
}
