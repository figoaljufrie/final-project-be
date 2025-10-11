import { Router } from "express";
import { AuthMiddleware } from "../../../../shared/middleware/auth-middleware";
import { forgotPasswordLimiter } from "../../../../shared/middleware/rate-limit-middleware";
import { validate } from "../../../../shared/middleware/validate-middleware";
import { AuthController } from "../controllers/auth-controller";
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resendVerificationSchema,
  resetPasswordSchema,
  verifyEmailAndSetPasswordSchema,
} from "../validators/auth-validator";

export class AuthRouter {
  private router = Router();
  private authController = new AuthController();
  private authMiddleware = new AuthMiddleware();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    // ---------- Registration ----------
    this.router.post(
      "/auth/register",
      validate(registerSchema),
      this.authController.registerUser
    );

    this.router.post(
      "/auth/register-tenant",
      validate(registerSchema),
      this.authController.registerTenant
    );

    // ---------- Login & Logout ----------
    this.router.post(
      "/auth/login",
      validate(loginSchema),
      this.authController.login
    );

    this.router.post(
      "/auth/logout",
      this.authMiddleware.authenticate,
      this.authController.logout
    );

    // ---------- Email Verification ----------
    this.router.post("/auth/verify-email", this.authController.verifyEmail);

    this.router.post(
      "/auth/verify-email-set-password",
      validate(verifyEmailAndSetPasswordSchema),
      this.authController.verifyEmailAndSetPassword
    );

    this.router.post(
      "/auth/resend-verification",
      forgotPasswordLimiter,
      validate(resendVerificationSchema),
      this.authController.resendVerificationEmail
    );

    // ---------- Password Reset ----------
    this.router.post(
      "/auth/forgot-password",
      forgotPasswordLimiter,
      validate(forgotPasswordSchema),
      this.authController.forgotPassword
    );

    this.router.post(
      "/auth/reset-password",
      validate(resetPasswordSchema),
      this.authController.resetPassword
    );
  }

  public getRouter() {
    return this.router;
  }
}
