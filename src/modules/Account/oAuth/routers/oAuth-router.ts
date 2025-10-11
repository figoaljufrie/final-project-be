// src/modules/Account/oauth/routes/oAuth-router.ts
import { Router } from "express";
import { validate } from "../../../../shared/middleware/validate-middleware";
import { OAuthController } from "../controllers/oAuth-controller";
import { socialLoginValidator } from "../validators/oAuth-validators";

export class OAuthRouter {
  private router = Router();
  private oAuthController = new OAuthController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post(
      "/oauth/login",
      validate(socialLoginValidator),
      this.oAuthController.login
    );
  }

  public getRouter() {
    return this.router;
  }
}
