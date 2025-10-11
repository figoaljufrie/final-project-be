import { Router } from "express";
import { $Enums } from "../../../../generated/prisma";
import { AuthMiddleware } from "../../../../shared/middleware/auth-middleware";
import { JWTMiddleware } from "../../../../shared/middleware/jwt-middleware";
import { OwnershipMiddleware } from "../../../../shared/middleware/ownership-middleware";
import { RBACMiddleware } from "../../../../shared/middleware/rbac-middleware";
import { UploaderMiddleware } from "../../../../shared/middleware/uploader-middleware";
import { validate } from "../../../../shared/middleware/validate-middleware";
import { PropertyController } from "../controller/property-controller";
import {
  createPropertySchema,
  propertyCalendarSchema,
  propertyIdSchema,
  propertySearchSchema,
  updatePropertySchema,
} from "../validators/property-validators";

export class PropertyRouter {
  private router = Router();
  private propertyController = new PropertyController();
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

    this.router.get(
      "/properties/search",
      validate(propertySearchSchema),
      this.propertyController.search
    );
    this.router.get(
      "/properties/:id",
      validate(propertyIdSchema),
      this.propertyController.getDetails
    );
    this.router.get(
      "/properties/:id/calendar",
      validate(propertyCalendarSchema),
      this.propertyController.getCalendar
    );

    this.router.get(
      "/tenant/properties",
      ...tenantAccess,
      this.propertyController.getTenantProperties
    );

    this.router.post(
      "/tenant/properties",
      ...tenantAccess,
      this.uploaderMiddleware.upload().array("images", 5),
      validate(createPropertySchema),
      this.propertyController.create
    );

    this.router.patch(
      "/tenant/properties/:propertyId",
      ...tenantAccess,
      this.ownershipMiddleware.checkPropertyOwnership,
      this.uploaderMiddleware.upload().array("images", 5),
      validate(updatePropertySchema),
      this.propertyController.update
    );

    this.router.delete(
      "/tenant/properties/:id",
      ...tenantAccess,
      this.ownershipMiddleware.checkPropertyOwnership,
      validate(propertyIdSchema),
      this.propertyController.delete
    );
  }

  public getRouter() {
    return this.router;
  }
}
