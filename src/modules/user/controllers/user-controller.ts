// modules/user/controllers/user-controller.ts
import { Request, Response } from "express";
import { errHandle } from "../../../shared/helpers/err-handler";
import { succHandle } from "../../../shared/helpers/succ-handler";
import { CloudinaryUtils } from "../../../shared/utils/cloudinary/cloudinary";
import { UserService } from "../services/user-service";

export class UserController {
  private userService = new UserService();
  private cloudinaryUtils = new CloudinaryUtils();

  public getAll = async (req: Request, res: Response) => {
    try {
      const result = await this.userService.getAll();
      succHandle(res, "Successfully retrieved all users", result, 200);
    } catch (err) {
      errHandle(res, "Failed to get all users", 500, (err as Error).message);
    }
  };

  public getMe = async (req: Request, res: Response) => {
    try {
      const authUser = (req as any).user;
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
      const { email } = req.body;
      const userId = (req as any).user.id;
      const result = await this.userService.updateEmail(userId, email);
      succHandle(res, "Email update initiated", result, 200);
    } catch (err) {
      errHandle(res, "Failed to update email", 400, (err as Error).message);
    }
  };

  public updateUser = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const result = await this.userService.updateUser(userId, req.body);
      succHandle(res, "User updated successfully", result, 200);
    } catch (err) {
      errHandle(res, "Failed to update user", 400, (err as Error).message);
    }
  };

  public updateAvatar = async (req: Request, res: Response) => {
    try {
      const authUser = (req as any).user;
      const file = req.file as Express.Multer.File;
      if (!file) {
        return errHandle(
          res,
          "No file uploaded",
          400,
          "Please upload an avatar file"
        );
      }

      const result = await this.cloudinaryUtils.upload(file);
      const updatedUser = await this.userService.updateAvatar(
        authUser.id,
        result.secure_url
      );

      succHandle(res, "Avatar updated successfully", updatedUser, 200);
    } catch (err) {
      errHandle(res, "Failed to update avatar", 400, (err as Error).message);
    }
  };

  public updatePassword = async (req: Request, res: Response) => {
    try {
      const authUser = (req as any).user;
      const { currentPassword, newPassword } = req.body;

      const result = await this.userService.updatePasswordWithCurrent(
        authUser.id,
        currentPassword,
        newPassword
      );

      succHandle(res, "Password updated successfully", result, 200);
    } catch (err) {
      errHandle(res, "Failed to update password", 400, (err as Error).message);
    }
  };

  public softDeleteUser = async (req: Request, res: Response) => {
    try {
      const authUser = (req as any).user;
      const result = await this.userService.softDeleteUser(authUser.id);
      succHandle(res, "User soft-deleted successfully", result, 200);
    } catch (err) {
      errHandle(res, "Failed to soft-delete user", 400, (err as Error).message);
    }
  };

  public hardDeleteUser = async (req: Request, res: Response) => {
    try {
      const authUser = (req as any).user;
      const result = await this.userService.hardDeleteUser(authUser.id);
      succHandle(res, "User deleted successfully", result, 200);
    } catch (err) {
      errHandle(res, "Failed to delete user", 400, (err as Error).message);
    }
  };
}
