import bcrypt from "bcrypt";
import { Request, Response } from "express";
import { $Enums } from "../../../generated/prisma";
import { errHandle } from "../../../shared/helpers/err-handler";
import { succHandle } from "../../../shared/helpers/succ-handler";
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
      return succHandle(res, "Login successful", result, 200);
    } catch (err) {
      return errHandle(res, "Login failed", 401, (err as Error).message);
    }
  };

  // ✅ verify email & set password with Bearer token
  public verifyEmailAndSetPassword = async (req: Request, res: Response) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return errHandle(res, "Authorization token missing", 401);
      }

      const token = authHeader.split(" ")[1];
      const { password } = req.body;
      if (!password) return errHandle(res, "Password is required", 400);

      const hashedPassword = await bcrypt.hash(password, 10);

      const result = await this.authService.verifyTokenAndUpdate(
        token as string,
        $Enums.VerificationTokenType.email_verification,
        { isEmailVerified: true, password: hashedPassword }
      );

      return succHandle(res, "Email verified and password set", result, 200);
    } catch (err) {
      return errHandle(res, "Verification failed", 400, (err as Error).message);
    }
  };

  // ✅ verify email with Bearer token
  public verifyEmail = async (req: Request, res: Response) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return errHandle(res, "Authorization token missing", 401);
      }

      const token = authHeader.split(" ")[1];

      const result = await this.authService.verifyTokenAndUpdate(
        token as string,
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

  // ✅ reset password with Bearer token
  public resetPassword = async (req: Request, res: Response) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return errHandle(res, "Authorization token missing", 401);
      }

      const token = authHeader.split(" ")[1];
      const { newPassword } = req.body;
      if (!newPassword) return errHandle(res, "New password is required", 400);

      const hashedPassword = await bcrypt.hash(newPassword, 10);

      const result = await this.authService.verifyTokenAndUpdate(
        token as string,
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
