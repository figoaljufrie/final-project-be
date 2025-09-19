// modules/oauth/routes/oauth-router.ts
import { Router } from "express";
import { OAuthController } from "../controllers/oAuth-controller";

export class OAuthRouter {
  private router = Router();
  private oauthController = new OAuthController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    // Google OAuth login
    this.router.post("/auth/google", this.oauthController.googleLogin);
  }

  public getRouter() {
    return this.router;
  }
}

/*
https://accounts.google.com/o/oauth2/v2/auth?client_id=1055219068105-cvgf8tp55b57r1v7jrucuq6d3ikcv8i4.apps.googleusercontent.com&redirect_uri=http://localhost:8000/api/auth/google&response_type=code&scope=email%20profile&access_type=offline&prompt=consent

*/