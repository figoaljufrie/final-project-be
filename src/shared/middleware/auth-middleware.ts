import { Request, Response, NextFunction } from "express";
import { AuthService } from "../../modules/auth/services/auth-service";
import { errHandle } from "../helpers/err-handler";

export class AuthMiddleware {
  authService = new AuthService();


  public authenticate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader) {
        return errHandle(res, "Authorization header is missing.", 401);
      }

      const token = authHeader.split(" ")[1];
      if (!token) {
        return errHandle(res, "Token is missing.", 401);
      }

      // Validate token & fetch user from DB
      const user = await this.authService.validateToken(token);

      if (!user) {
        return errHandle(res, "User not found.", 401);
      }

      // Attach user to request
      (req as any).user = user;

      next();
    } catch (error) {
      return errHandle(res, "Invalid token: " + (error as Error).message, 401);
    }
  }
}
