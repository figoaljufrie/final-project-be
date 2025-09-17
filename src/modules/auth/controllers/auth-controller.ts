// modules/auth/controller/auth-controller.ts
import { Request, Response } from "express";
import { AuthService } from "../services/auth-service";
import { succHandle } from "../../../shared/helpers/succ-handler";
import { errHandle } from "../../../shared/helpers/err-handler";

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  public registerUser = async (req: Request, res: Response) => {
    try {
      const user = await this.authService.createUser(req.body);
      return succHandle(res, "User registered successfully", user, 201);
    } catch (err) {
      errHandle(
        res,
        "Failed to register as user.",
        500,
        (err as Error).message
      );
    }
  };

  public registerTenant = async (req: Request, res: Response) => {
    try {
      const tenant = await this.authService.createTenant(req.body);
      return succHandle(res, "Tenant registered successfully", tenant, 201);
    } catch (err) {
      errHandle(
        res,
        "Failed to register as tenant",
        500,
        (err as Error).message
      );
    }
  };

  public login = async (req: Request, res: Response) => {
    try {
      const data = await this.authService.login(req.body);
      return succHandle(res, "Login successful", data, 200);
    } catch (err) {
      errHandle(res, "Failed to login", 500, (err as Error).message);
    }
  };

  public sendVerificationEmail = async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      if (!email) {
        return errHandle(res, "Email is required", 400);
      }

      const data = await this.authService.sendVerificationEmail(email);
      return succHandle(res, "Verification email sent", data, 200);
    } catch (err) {
      errHandle(
        res,
        "Failed to send email verification",
        500,
        (err as Error).message
      );
    }
  };

  public verifyEmail = async (req: Request, res: Response) => {
    try {
      const { token } = req.params;
      if (!token) {
        return errHandle(res, "Verification token is required", 400);
      }
      const data = await this.authService.verifyEmail(token);
      return succHandle(res, "Email verified successfully", data, 200);
    } catch (err) {
      errHandle(res, "Failed to verify email", 500, (err as Error).message);
    }
  };

  public forgotPassword = async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      const data = await this.authService.forgotPassword(email);
      return succHandle(res, "Password reset link sent", data, 200);
    } catch (err) {
      errHandle(res, "Failed to sent reset link", 500, (err as Error).message);
    }
  };

  public resetPassword = async (req: Request, res: Response) => {
    try {
      const authUser = (req as any).user;
      if (!authUser || !authUser.id) {
        return errHandle(res, "Invalid token payload", 401);
      }

      const { newPassword } = req.body;
      if (!newPassword) {
        return errHandle(res, "New Password is required", 400);
      }

      const result = await this.authService.resetPassword(
        authUser.id,
        newPassword
      );
      return succHandle(res, "Password reset successfully", result, 200);
    } catch (err) {
      return errHandle(
        res,
        "Failed to reset password",
        400,
        (err as Error).message
      );
    }
  };
}
