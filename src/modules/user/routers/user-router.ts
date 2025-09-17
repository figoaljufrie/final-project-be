import { Router } from "express";
import { UserController } from "../controllers/user-controller";
import { $Enums } from "../../../generated/prisma";

export class UserRouter {
  private router = Router();

  private userController = new UserController();

  constructor() {
    this.initializeRoutes();
  }
  // rbac, auth, validator
  private initializeRoutes() {
    this.router.get("/users", this.userController.getAll);

    //add JWT payload later:
    this.router.get("/users/me", this.userController.getMe);

    this.router.get("/users/:id", this.userController.findById);

    this.router.patch(
      "/users/:id/update-email",
      this.userController.updateEmail
    );

    this.router.patch("/users/:id/update-user", this.userController.updateUser);

    this.router.patch(
      "/users/:id/update-avatar",
      this.userController.updateAvatar
    );

    this.router.patch(
      "/users/:id/password",
      this.userController.updatePassword
    );

    this.router.patch(
      "/users/:id/soft-delete",
      this.userController.softDeleteUser
    );

    this.router.delete("/users/:id", this.userController.hardDeleteUser);
  }

  public getRouter() {
    return this.router;
  }
}
