import { Router } from "express";
import { AuthMiddleware } from "../../../../shared/middleware/auth-middleware";
import { JWTMiddleware } from "../../../../shared/middleware/jwt-middleware";
import { OwnershipMiddleware } from "../../../../shared/middleware/ownership-middleware";
import { UploaderMiddleware } from "../../../../shared/middleware/uploader-middleware";
import { RoomImageController } from "../controllers/room-image-controller";

export class RoomImageRouter {
  private router = Router();
  private controller = new RoomImageController();
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

    // Upload multiple images for a room
    this.router.post(
      "/properties/:propertyId/rooms/:roomId/images",
      ...tenantAccess,
      this.ownershipMiddleware.checkRoomOwnership,
      this.uploaderMiddleware.upload().array("images", 5),
      this.controller.uploadImages
    );

    // Update a single image (metadata or file)
    // PATCH to specific imageId
    this.router.patch(
      "/properties/:propertyId/rooms/:roomId/images/:imageId",
      ...tenantAccess,
      this.ownershipMiddleware.checkRoomOwnership,
      // allow optional file replacement (single or array). We'll accept array('images') to be safe.
      this.uploaderMiddleware.upload().array("images", 1),
      this.controller.updateImage
    );

    // Delete all images for a room
    this.router.delete(
      "/properties/:propertyId/rooms/:roomId/images",
      ...tenantAccess,
      this.ownershipMiddleware.checkRoomOwnership,
      this.controller.deleteAll
    );

    // Delete a single image by id
    this.router.delete(
      "/properties/:propertyId/rooms/:roomId/images/:imageId",
      ...tenantAccess,
      this.ownershipMiddleware.checkRoomOwnership,
      this.controller.deleteImage
    );
  }

  public getRouter() {
    return this.router;
  }
}