import { Request, Response, NextFunction } from "express";
import { ZodType } from "zod";

export const validate =
  (schema: ZodType) => (req: Request, res: Response, next: NextFunction) => {
    const data =
      req.method === "GET" || req.method === "DELETE" ? req.query : req.body;

    const result = schema.safeParse(data);

    if (!result.success) {
      const errors = result.error.issues.map((i) => i.message);
      return res.status(400).json({
        status: false,
        message: "Validation error",
        errors,
      });
    }

    if (req.method === "GET" || req.method === "DELETE") {
      Object.keys(req.query).forEach((key) => delete (req.query as any)[key]);
      Object.assign(req.query, result.data);
    } else {
      req.body = result.data;
    }

    next();
  };
