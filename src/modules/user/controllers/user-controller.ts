// modules/user/controllers/user-controller.ts
import { UserService } from "../services/user-service";
import { errHandle } from "../../../shared/helpers/err-handler";
import { succHandle } from "../../../shared/helpers/succ-handler";
import { Request, Response } from "express";

export class UserController {
  private userService = new UserService();

  public getAll = async (req: Request, res: Response) => {
    try {
      const authUser = (req as any).user;
      if (!authUser || !authUser.id) throw new Error("Unauthorized");

      const result = await this.userService.getAll();
      succHandle(res, "Successfully retrieved all users", result, 200);
    } catch (err) {
      errHandle(res, "Failed to get all users", 500, (err as Error).message);
    }
  };

  public getMe = async (req: Request, res: Response) => {
    try {
      const authUser = (req as any).user;
      if (!authUser || !authUser.id) throw new Error("Unauthorized");

      const result = await this.userService.getMe(authUser.id);
      succHandle(res, "Successfully retrieved user profile", result, 200);
    } catch (err) {
      errHandle(res, "Failed to get user profile", 401, (err as Error).message);
    }
  };

  public findById = async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const result = await this.userService.findById(id);
      succHandle(res, "Successfully retrieved user by ID", result, 200);
    } catch (err) {
      errHandle(res, "Failed to get user by ID", 404, (err as Error).message);
    }
  };

  public updateEmail = async (req: Request, res: Response) => {
    try {
      const authUser = (req as any).user;
      if (!authUser || !authUser.id) throw new Error("Unauthorized");

      const { email } = req.body;
      const result = await this.userService.updateEmail(authUser.id, email);
      succHandle(res, "Email updated successfully", result, 200);
    } catch (err) {
      errHandle(res, "Failed to update email", 400, (err as Error).message);
    }
  };

  public updateUser = async (req: Request, res: Response) => {
    try {
      const authUser = (req as any).user;
      if (!authUser || !authUser.id) throw new Error("Unauthorized");

      const data = req.body; // assume full DTO
      const result = await this.userService.updateUser(authUser.id, data);
      succHandle(res, "User updated successfully", result, 200);
    } catch (err) {
      errHandle(res, "Failed to update user", 400, (err as Error).message);
    }
  };

  public updateAvatar = async (req: Request, res: Response) => {
    try {
      const authUser = (req as any).user;
      if (!authUser || !authUser.id) throw new Error("Unauthorized");

      const { avatarUrl } = req.body;
      const result = await this.userService.updateAvatar(
        authUser.id,
        avatarUrl
      );
      succHandle(res, "Avatar updated successfully", result, 200);
    } catch (err) {
      errHandle(res, "Failed to update avatar", 400, (err as Error).message);
    }
  };

  public updatePassword = async (req: Request, res: Response) => {
    try {
      const authUser = (req as any).user; // get logged-in user from auth middleware
      if (!authUser || !authUser.id) {
        return errHandle(res, "User not authenticated", 401, "Unauthorized");
      }

      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword) {
        return errHandle(
          res,
          "Both passwords are required",
          400,
          "Bad Request"
        );
      }

      const result = await this.userService.updatePasswordWithCurrent(
        authUser.id,
        currentPassword,
        newPassword
      );

      return succHandle(res, "Password updated successfully", result, 200);
    } catch (err) {
      return errHandle(
        res,
        "Failed to update password",
        400,
        (err as Error).message
      );
    }
  };

  public softDeleteUser = async (req: Request, res: Response) => {
    try {
      const authUser = (req as any).user;
      if (!authUser || !authUser.id) throw new Error("Unauthorized");

      const result = await this.userService.softDeleteUser(authUser.id);
      succHandle(res, "User soft-deleted successfully", result, 200);
    } catch (err) {
      errHandle(res, "Failed to soft-delete user", 400, (err as Error).message);
    }
  };

  public hardDeleteUser = async (req: Request, res: Response) => {
    try {
      const authUser = (req as any).user;
      if (!authUser || !authUser.id) throw new Error("Unauthorized");

      const result = await this.userService.hardDeleteUser(authUser.id);
      succHandle(res, "User deleted successfully", result, 200);
    } catch (err) {
      errHandle(res, "Failed to delete user", 400, (err as Error).message);
    }
  };
}
