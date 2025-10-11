import { Request, Response, NextFunction } from "express";
import { ZodType } from "zod";

export const validate =
  (schema: ZodType) => (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const errors = result.error.issues.map((i) => i.message);
      return res.status(400).json({
        status: false,
        message: "Validation error",
        errors,
      });
    }

    req.body = result.data; // sanitized
    next();
  };
