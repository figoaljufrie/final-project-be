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

    this.router.get("/users", this.userController.getAll)

    this.router.get("/users/me", this.userController.getMe)

    this.router.get("/users/:id", this.userController.findById)

    this.router.get("/users/find-email", this.userController.findByEmail)

    this.router.patch("/users/update-user", this.userController.updateUser)

    this.router.put("/users/update-avatar", this.userController.updateAvatar)
    
    this.router.put("/users/update-password", this.userController.updatePassword)

    this.router.delete("/users/delete-user", this.userController.hardDeleteUser)
  }

  public getRouter() {
    return this.router
  }
}
