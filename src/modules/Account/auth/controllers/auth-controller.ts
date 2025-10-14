import bcrypt from "bcrypt";
import { Request, Response } from "express";
import { $Enums } from "../../../../generated/prisma";
import { errHandle } from "../../../../shared/helpers/err-handler";
import { succHandle } from "../../../../shared/helpers/succ-handler";
import { AuthService } from "../services/auth-service";

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  public registerUser = async (req: Request, res: Response) => {
    try {
      const result = await this.authService.createUser(req.body);
      return succHandle(res, "User registered successfully", result, 201);
    } catch (err) {
      return errHandle(
        res,
        "Failed to register user",
        400,
        (err as Error).message
      );
    }
  };

  public registerTenant = async (req: Request, res: Response) => {
    try {
      const result = await this.authService.createTenant(req.body);
      return succHandle(res, "Tenant registered successfully", result, 201);
    } catch (err) {
      return errHandle(
        res,
        "Failed to register tenant",
        400,
        (err as Error).message
      );
    }
  };

  public login = async (req: Request, res: Response) => {
    try {
      const result = await this.authService.login(req.body);

      const isProd = process.env.NODE_ENV === "production";

      res.cookie("token", result.accessToken, {
        httpOnly: true,
        secure: isProd, // secure in production
        sameSite: isProd ? "none" : "lax", // cross-site for prod, lax for dev
        maxAge: 2 * 60 * 60 * 1000,
      });

      return succHandle(res, "Login successful", { user: result.user }, 200);
    } catch (err) {
      return errHandle(res, "Login failed", 401, (err as Error).message);
    }
  };

  public logout = async (req: Request, res: Response) => {
    try {
      const isProd = process.env.NODE_ENV === "production";

      res.clearCookie("token", {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? "none" : "lax",
      });

      return succHandle(res, "Logout successful", null, 200);
    } catch (err) {
      return errHandle(res, "Logout failed", 400, (err as Error).message);
    }
  };

  public verifyEmailAndSetPassword = async (req: Request, res: Response) => {
    try {
      const token = req.body.token;
      if (!token) return errHandle(res, "Authorization token missing", 401);

      const { password } = req.body;
      if (!password) return errHandle(res, "Password is required", 400);

      const hashedPassword = await bcrypt.hash(password, 10);

      const result = await this.authService.verifyTokenAndUpdate(
        token,
        $Enums.VerificationTokenType.email_verification,
        { isEmailVerified: true, password: hashedPassword }
      );

      return succHandle(res, "Email verified and password set", result, 200);
    } catch (err) {
      return errHandle(res, "Verification failed", 400, (err as Error).message);
    }
  };

  public verifyEmail = async (req: Request, res: Response) => {
    try {
      const token = req.body.token;  
      if (!token) return errHandle(res, "Authorization token missing", 401);

      const result = await this.authService.verifyTokenAndUpdate(
        token,
        $Enums.VerificationTokenType.email_verification,
        { isEmailVerified: true }
      );

      return succHandle(res, "Email verified successfully", result, 200);
    } catch (err) {
      return errHandle(res, "Verification failed", 400, (err as Error).message);
    }
  };

  public resendVerificationEmail = async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      const result = await this.authService.resendVerificationEmail(email);
      return succHandle(res, "Verification email resent", result, 200);
    } catch (err) {
      return errHandle(
        res,
        "Failed to resend email",
        400,
        (err as Error).message
      );
    }
  };

  public forgotPassword = async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      const result = await this.authService.forgotPassword(email);
      return succHandle(res, "Password reset link sent", result, 200);
    } catch (err) {
      return errHandle(
        res,
        "Failed to send reset link",
        400,
        (err as Error).message
      );
    }
  };

  public resetPassword = async (req: Request, res: Response) => {
    try {
      const token = req.cookies.token;
      if (!token) return errHandle(res, "Authorization token missing", 401);

      const { newPassword } = req.body;
      if (!newPassword) return errHandle(res, "New password is required", 400);

      const hashedPassword = await bcrypt.hash(newPassword, 10);

      const result = await this.authService.verifyTokenAndUpdate(
        token,
        $Enums.VerificationTokenType.password_reset,
        { password: hashedPassword }
      );

      return succHandle(res, "Password reset successful", result, 200);
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
