// src/modules/user/routes/user-router.ts
import { Router } from "express";
import { $Enums } from "../../../../generated/prisma";
import { AuthMiddleware } from "../../../../shared/middleware/auth-middleware";
import { JWTMiddleware } from "../../../../shared/middleware/jwt-middleware";
import { RBACMiddleware } from "../../../../shared/middleware/rbac-middleware";
import { UploaderMiddleware } from "../../../../shared/middleware/uploader-middleware";
import { validate } from "../../../../shared/middleware/validate-middleware";
import { UserController } from "../controllers/user-controller";
import {
  updateEmailValidator,
  updatePasswordValidator,
  updateUserValidator,
} from "../validators/user-validators";

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
    // ⚠️ Order matters
    this.router.get(
      "/users/me",
      this.authMiddleware.authenticate,
      this.userController.getMe
    );

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

    // ✅ PATCH routes with Zod validation
    this.router.patch(
      "/users/update-email",
      this.authMiddleware.authenticate,
      validate(updateEmailValidator),
      this.userController.updateEmail
    );

    this.router.patch(
      "/users/update-user",
      this.authMiddleware.authenticate,
      validate(updateUserValidator),
      this.userController.updateUser
    );

    this.router.patch(
      "/users/update-avatar",
      this.authMiddleware.authenticate,
      this.uploaderMiddleware.upload().single("avatar"),
      this.uploaderMiddleware.fileFilter([
        "image/png",
        "image/jpeg",
        "image/jpg",
        "image/gif",
      ]),
      this.userController.updateAvatar
    );

    this.router.patch(
      "/users/update-password",
      this.jwtMiddleware.verifyToken,
      this.authMiddleware.authenticate,
      validate(updatePasswordValidator),
      this.userController.updatePassword
    );

    this.router.patch(
      "/users/soft-delete",
      this.authMiddleware.authenticate,
      this.userController.softDeleteUser
    );

    this.router.delete(
      "/users",
      this.authMiddleware.authenticate,
      this.userController.hardDeleteUser
    );
  }

  public getRouter() {
    return this.router;
  }
}
