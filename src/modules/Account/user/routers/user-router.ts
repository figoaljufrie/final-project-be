import { Router } from "express";
import { $Enums } from "../../../../generated/prisma";
import { AuthMiddleware } from "../../../../shared/middleware/auth-middleware";
import { JWTMiddleware } from "../../../../shared/middleware/jwt-middleware";
import { RBACMiddleware } from "../../../../shared/middleware/rbac-middleware";
import { UploaderMiddleware } from "../../../../shared/middleware/uploader-middleware";
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
    // ⚠️ IMPORTANT: Put specific routes BEFORE parameterized routes

    // GET /users/me - must come BEFORE /users/:id
    this.router.get(
      "/users/me",
      this.authMiddleware.authenticate,
      this.userController.getMe
    );

    // GET /users - list all users
    this.router.get(
      "/users",
      this.authMiddleware.authenticate,
      this.rbacMiddleware.checkRole([$Enums.UserRole.tenant]),
      this.userController.getAll
    );

    // GET /users/:id - must come AFTER /users/me
    this.router.get(
      "/users/:id",
      this.authMiddleware.authenticate,
      this.rbacMiddleware.checkRole([$Enums.UserRole.tenant]),
      this.userController.findById
    );

    // PATCH routes
    this.router.patch(
      "/users/update-email",
      this.authMiddleware.authenticate,
      this.userController.updateEmail
    );

    this.router.patch(
      "/users/update-user",
      this.authMiddleware.authenticate,
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
      this.userController.updatePassword
    );

    this.router.patch(
      "/users/soft-delete",
      this.authMiddleware.authenticate,
      this.userController.softDeleteUser
    );

    // DELETE routes
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
