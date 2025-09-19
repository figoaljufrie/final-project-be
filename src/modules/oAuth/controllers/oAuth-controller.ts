import { Request, Response } from "express";
import { GoogleAuthService } from "../services/providers/google-oAuth-provider";
import { OAuthService } from "../services/core/oAuth-service";
import { errHandle } from "../../../shared/helpers/err-handler";
import { succHandle } from "../../../shared/helpers/succ-handler";

export class OAuthController {
  private googleAuthService = new GoogleAuthService();
  private oauthService = new OAuthService();

  // POST /auth/google
  public googleLogin = async (req: Request, res: Response) => {
    try {
      const { code } = req.body;
      if (!code) {
        return errHandle(res, "Authorization code is required", 400);
      }

      // 1) Exchange code for tokens & get profile
      const { profile, tokens } = await this.googleAuthService.loginWithCode(
        code
      );

      // 2) Pass profile & tokens to OAuthService for login/signup
      const session = await this.oauthService.oauthLogin(profile, tokens);

      // 3) Return JWT session
      return succHandle(res, "Login successful", session);
    } catch (err) {
      return errHandle(res, "Internal server error", 500, err);
    }
  };
}
