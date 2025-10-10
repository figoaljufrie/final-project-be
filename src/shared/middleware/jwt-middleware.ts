import { Request, Response, NextFunction } from "express";
import { verify, JwtPayload } from "jsonwebtoken";
import { errHandle } from "../helpers/err-handler";

export class JWTMiddleware {
  public verifyToken = (req: Request, res: Response, next: NextFunction) => {
    try {
      const secret = process.env.JWT_SECRET;
      if (!secret) return errHandle(res, "JWT secret key not set", 500);

      const token = req.cookies?.token;
      if (!token) return errHandle(res, "Token is missing.", 401);

      let decoded: string | JwtPayload;
      try {
        decoded = verify(token, secret);
      } catch (error) {
        return errHandle(res, "Token expired or invalid.", 401, error);
      }

      (req as any).user = decoded;
      next();
    } catch (error) {
      return errHandle(res, "Failed to verify token.", 401, error);
    }
  };
}
