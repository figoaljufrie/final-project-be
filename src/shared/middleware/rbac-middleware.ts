import { Request, Response, NextFunction } from "express";
import { UserDTO } from "../../modules/user/dto/user-dto";
import { errHandle } from "../helpers/err-handler";
import { $Enums } from "../../generated/prisma";

export class RBACMiddleware {
  public checkRole(requiredRoles: $Enums.UserRole[]) {
    return (req: Request, res: Response, next: NextFunction) => {
      try {
        const user = (req as any).user as UserDTO;

        if (!user) return errHandle(res, "Unauthorized user", 401);

        if (!user.role || !requiredRoles.includes(user.role)) {
          return errHandle(res, "Forbidden: insufficient permissions", 403);
        }

        next();
      } catch (error) {
        return errHandle(res, "Failed to check roles", 500, error);
      }
    };
  }
}
