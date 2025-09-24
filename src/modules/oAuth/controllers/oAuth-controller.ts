import { Request, Response } from "express";
import { errHandle } from "../../../shared/helpers/err-handler";
import { succHandle } from "../../../shared/helpers/succ-handler";
import { OAuthService } from "../services/oAuth-service";

const service = new OAuthService();

export class OAuthController {
  public login = async (req: Request, res: Response) => {
    try {
      const { idToken, provider } = req.body;
      if (!idToken || !provider)
        return errHandle(res, "idToken and provider required", 400);

      const result = await service.socialLogin(idToken, provider);
      return succHandle(res, "Social login successful", result, 200);
    } catch (err) {
      return errHandle(res, "Social login failed", 401, (err as Error).message);
    }
  };
}
