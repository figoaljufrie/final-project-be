// modules/user/routes/user-router.ts
import { Router } from "express";
import { $Enums } from "../../../generated/prisma";
import { AuthMiddleware } from "../../../shared/middleware/auth-middleware";
import { JWTMiddleware } from "../../../shared/middleware/jwt-middleware";
import { RBACMiddleware } from "../../../shared/middleware/rbac-middleware";
import { UploaderMiddleware } from "../../../shared/middleware/uploader-middleware";
import { UserController } from "../controllers/user-controller";

export class UserRouter {
  private router = Router();
  private userController = new UserController();
  private authMiddleware = new AuthMiddleware();
  private jwtMiddleware = new JWTMiddleware();
  private rbacMiddleware = new RBACMiddleware();
  private uploaderMiddleware = new UploaderMiddleware();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    // RBAC restricted (admin only)
    this.router.get(
      "/users",
      this.authMiddleware.authenticate,
      this.rbacMiddleware.checkRole([$Enums.UserRole.tenant]),
      this.userController.getAll
    );

    this.router.get(
      "/users/:id",
      this.authMiddleware.authenticate,
      this.rbacMiddleware.checkRole([$Enums.UserRole.tenant]),
      this.userController.findById
    );

    // Auth required
    this.router.get(
      "/users/me",
      this.authMiddleware.authenticate,
      this.userController.getMe
    );

    this.router.patch(
      "/users/:id/update-email",
      this.authMiddleware.authenticate,
      this.userController.updateEmail
    );

    this.router.patch(
      "/users/:id/update-user",
      this.authMiddleware.authenticate,
      this.userController.updateUser
    );

    this.router.patch(
      "/users/:id/update-avatar",
      this.authMiddleware.authenticate,
      this.uploaderMiddleware.upload().single("avatar"),
      this.uploaderMiddleware.fileFilter([
        "image/png",
        "image/jpeg",
        "image/jpg",
      ]),
      this.userController.updateAvatar
    );

    // Password update → requires JWT verification
    this.router.patch(
      "/users/:id/update-password",
      this.jwtMiddleware.verifyToken,
      this.authMiddleware.authenticate,
      this.userController.updatePassword
    );

    this.router.patch(
      "/users/:id/soft-delete",
      this.authMiddleware.authenticate,
      this.userController.softDeleteUser
    );

    this.router.delete(
      "/users/:id",
      this.authMiddleware.authenticate,
      this.userController.hardDeleteUser
    );
  }

  public getRouter() {
    return this.router;
  }
}
