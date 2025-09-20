import { Router } from "express";
import {
  forgotPasswordLimiter,
  loginLimiter,
} from "../../../shared/middleware/rate-limit-middleware";
import { AuthController } from "../controllers/auth-controller";

export class AuthRouter {
  private router = Router();
  private authController = new AuthController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    // ---------- Registration ----------
    this.router.post("/auth/register", this.authController.registerUser);
    this.router.post("/auth/register-tenant", this.authController.registerTenant);

    // ---------- Login ----------
    this.router.post("/auth/login", 
      // loginLimiter,
      this.authController.login);

    // ---------- Email Verification ----------
    this.router.post("/auth/verify-email", this.authController.verifyEmail);
    this.router.post(
      "/auth/verify-email-set-password",
      this.authController.verifyEmailAndSetPassword
    );
    this.router.post(
      "/auth/resend-verification",
      forgotPasswordLimiter,
      this.authController.resendVerificationEmail
    );

    // ---------- Password Reset ----------
    this.router.post(
      "/auth/forgot-password",
      forgotPasswordLimiter,
      this.authController.forgotPassword
    );
    this.router.post("/auth/reset-password", this.authController.resetPassword);
  }

  public getRouter() {
    return this.router;
  }
}
