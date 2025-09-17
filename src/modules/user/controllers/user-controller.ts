import { UserService } from "../services/user-service";
import { errHandle } from "../../../shared/helpers/err-handler";
import { succHandle } from "../../../shared/helpers/succ-handler";
import { Request, Response } from "express";

export class UserController {
  private userService = new UserService();

  public getAll = async (req: Request, res: Response) => {
    try {
      const result = await this.userService.getAll();
      succHandle(res, "Successfully get all users", result, 200);
    } catch (error) {
      errHandle(res, "Failed to get all users.", 500, error);
    }
  };
  public getMe = async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const result = await this.userService.getMe(id);
      succHandle(res, "Sucessfully get user.", result, 200);
    } catch (error) {
      errHandle(res, "Failed to get user.", 500, error);
    }
  };

  public findById = async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const result = await this.userService.findById(id);
      succHandle(res, "Successfully find this user ID", result, 200);
    } catch (error) {
      errHandle(res, "Failed to get the user ID", 500, error);
    }
  };

  public updateEmail = async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const { email } = req.body;
      const result = await this.userService.updateEmail(id, email);
      succHandle(res, "Successfully update email", result, 200);
    } catch (error) {
      errHandle(res, "Failed to update email", 500, error);
    }
  };

  public updateUser = async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const { data } = req.body;
      const result = await this.userService.updateUser(id, data);
      succHandle(res, "Successfully update User", result, 200);
    } catch (error) {
      errHandle(res, "Failed to update User", 500, error);
    }
  };

  public updateAvatar = async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.userId);
      const { avatarUrl } = req.body;
      const result = await this.userService.updateAvatar(id, avatarUrl);

      succHandle(res, "Successfully update avatar", result, 200);
    } catch (error) {
      errHandle(res, "Failed to update Avatar", 500, error);
    }
  };

  public updatePassword = async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id)
      const { password } = req.body;
      const result = await this.userService.updatePassword(id, password);
      succHandle(res, "Successfully update password", result, 200);
    } catch (error) {
      errHandle(res, "Failed to update password", 500, error);
    }
  };

  public softDeleteUser = async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const result = await this.userService.softDeleteUser(id);
      succHandle(res, "Successfully soft-delete user", result, 200);
    } catch (error) {
      errHandle(res, "Failed to soft-delete user", 500, error);
    }
  };

  public hardDeleteUser = async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const result = await this.userService.hardDeleteUser(id);
      succHandle(res, "Successfully delete user", result, 200);
    } catch (error) {
      errHandle(res, "Failed to delete user", 500, error);
    }
  };
}
