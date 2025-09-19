import { Request, Response, NextFunction } from "express";
import { verify, JwtPayload } from "jsonwebtoken";
import { errHandle } from "../helpers/err-handler";

export class JWTMiddleware {
  public verifyToken = (req: Request, res: Response, next: NextFunction) => {
    try {
      const secret = process.env.JWT_SECRET;
      if (!secret) return errHandle(res, "JWT secret key not set", 500);

      const authHeader = req.headers.authorization;
      if (!authHeader)
        return errHandle(res, "Authorization header is missing.", 401);

      const token = authHeader.split(" ")[1];
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
