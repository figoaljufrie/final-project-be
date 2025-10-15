import { Router } from "express";
import { $Enums } from "../../../../generated/prisma";
import { AuthMiddleware } from "../../../../shared/middleware/auth-middleware";
import { JWTMiddleware } from "../../../../shared/middleware/jwt-middleware";
import { OwnershipMiddleware } from "../../../../shared/middleware/ownership-middleware";
import { RBACMiddleware } from "../../../../shared/middleware/rbac-middleware";
import { UploaderMiddleware } from "../../../../shared/middleware/uploader-middleware";
import { validate } from "../../../../shared/middleware/validate-middleware";

// 🧩 Import the new split controllers
import { PropertyCoreController } from "../controller/core/property-core";
import { PropertyCalendarController } from "../controller/features/property-calendar";
import { PropertyDetailController } from "../controller/features/property-detail";
import { PropertySearchController } from "../controller/features/property-search";

import {
  createPropertySchema,
  propertyCalendarSchema,
  propertyIdSchema,
  propertySearchSchema,
  updatePropertySchema,
} from "../validators/property-validators";

export class PropertyRouter {
  private router = Router();

  private propertyCoreController = new PropertyCoreController();
  private propertySearchController = new PropertySearchController();
  private propertyDetailController = new PropertyDetailController();
  private propertyCalendarController = new PropertyCalendarController();

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
      this.propertySearchController.search
    );

    this.router.get(
      "/properties/nearby",
      this.propertySearchController.searchNearby
    );
    
    this.router.get(
      "/properties/geocode",
      this.propertySearchController.geocodeAddress
    );

    this.router.get(
      "/properties/reverse-geocode",
      this.propertySearchController.reverseGeocode
    );

    this.router.get(
      "/properties/:id",
      this.propertyDetailController.getDetails
    );

    this.router.get(
      "/properties/:id/calendar",
      validate(propertyCalendarSchema),
      this.propertyCalendarController.getCalendar
    );

    this.router.get(
      "/tenant/properties",
      ...tenantAccess,
      this.propertyCoreController.getTenantProperties
    );

    this.router.post(
      "/tenant/properties",
      ...tenantAccess,
      this.uploaderMiddleware.upload().array("images", 5),
      validate(createPropertySchema),
      this.propertyCoreController.create
    );

    this.router.patch(
      "/tenant/properties/:propertyId",
      ...tenantAccess,
      this.ownershipMiddleware.checkPropertyOwnership,
      this.uploaderMiddleware.upload().array("images", 5),
      validate(updatePropertySchema),
      this.propertyCoreController.update
    );

    this.router.delete(
      "/tenant/properties/:id",
      ...tenantAccess,
      this.ownershipMiddleware.checkPropertyOwnership,
      validate(propertyIdSchema),
      this.propertyCoreController.delete
    );
  }

  public getRouter() {
    return this.router;
  }
}
