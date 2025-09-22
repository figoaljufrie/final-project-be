import { Router } from "express";
import { OAuthController } from "../controllers/oAuth-controller";

export class OAuthRouter {
  private router = Router();
  private oAuthController = new OAuthController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post("/oauth/login", this.oAuthController.login);
  }

  public getRouter() {
    return this.router;
  }
}
