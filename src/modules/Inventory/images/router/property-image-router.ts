import { Router } from "express";
import { AuthMiddleware } from "../../../../shared/middleware/auth-middleware";
import { JWTMiddleware } from "../../../../shared/middleware/jwt-middleware";
import { OwnershipMiddleware } from "../../../../shared/middleware/ownership-middleware";
import { UploaderMiddleware } from "../../../../shared/middleware/uploader-middleware";
import { PropertyImageController } from "../controllers/property-image-controller";

export class PropertyImageRouter {
  private router = Router();
  private controller = new PropertyImageController();
  private authMiddleware = new AuthMiddleware();
  private jwtMiddleware = new JWTMiddleware();
  private ownershipMiddleware = new OwnershipMiddleware();
  private uploaderMiddleware = new UploaderMiddleware();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    const tenantAccess = [
      this.jwtMiddleware.verifyToken,
      this.authMiddleware.authenticate,
    ];

    // ✅ Upload images for a property
    this.router.post(
      "/properties/:propertyId/images",
      ...tenantAccess,
      this.ownershipMiddleware.checkPropertyOwnership,
      this.uploaderMiddleware.upload().array("images", 5),
      this.controller.uploadImages
    );

    // ✅ Update property images (replacing or updating metadata)
    this.router.patch(
      "/properties/:propertyId/images/:imageId",
      ...tenantAccess,
      this.ownershipMiddleware.checkPropertyOwnership,
      this.uploaderMiddleware.upload().array("images", 5),
      this.controller.updateImage
    );

    // ✅ Delete all images or specific images by index/metadata in controller
    this.router.delete(
      "/properties/:propertyId/images/:imageId",
      ...tenantAccess,
      this.ownershipMiddleware.checkPropertyOwnership,
      this.controller.deleteImage
    );
  }

  public getRouter() {
    return this.router;
  }
}
