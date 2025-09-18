// modules/auth/routes/auth-router.ts
import { Router } from "express";
import { AuthMiddleware } from "../../../shared/middleware/auth-middleware";
import { JWTMiddleware } from "../../../shared/middleware/jwt-middleware";
import { RBACMiddleware } from "../../../shared/middleware/rbac-middleware";
import { AuthController } from "../controllers/auth-controller";
// import { validateEmail, validatePassword } etc. if needed

export class AuthRouter {
  private router = Router();
  private authController = new AuthController();
  private authMiddleware = new AuthMiddleware();
  private rbacMiddleware = new RBACMiddleware();
  private jwtMiddleware = new JWTMiddleware();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    // Registration
    this.router.post(
      "/auth/register-user",
      // validateEmail, validatePassword (optional)
      this.authController.registerUser
    );

    this.router.post(
      "/auth/register-tenant",
      // validateEmail, validatePassword
      this.authController.registerTenant
    );

    // Login
    this.router.post(
      "/auth/login",
      // validateEmail, validatePassword
      this.authController.login
    );

    // Email verification
    this.router.post(
      "/auth/email-verification",
      this.authController.sendVerificationEmail
    );

    this.router.get(
      "/auth/verify-email/:token",
      this.authController.verifyEmail
    );

    // Password reset
    this.router.post(
      "/auth/forgot-password",
      // validateEmail
      this.authController.forgotPassword
    );

    this.router.post(
      "/auth/reset-password",
      this.jwtMiddleware.verifyToken,
      this.authController.resetPassword
    );
  }

  public getRouter() {
    return this.router;
  }
}
