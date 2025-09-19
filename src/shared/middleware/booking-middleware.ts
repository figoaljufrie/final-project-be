import { ApiError } from "../utils/api-error";
import { Request, Response, NextFunction } from "express";

export function requireVerifiedEmail(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const user = (req as any).user; // decoded from JWT
  if (!user || !user.isEmailVerified) {
    throw new ApiError("Email must be verified before booking.", 403);
  }
  next();
}

// integrate pas isEmailVerified udah ada di auth process
