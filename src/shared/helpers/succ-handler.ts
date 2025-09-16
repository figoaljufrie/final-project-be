import { Response } from "express";

export function succHandle(
  res: Response,
  message: string,
  data: unknown = null,
  statusCode: number = 200
) {
  return res.status(statusCode).json({
    status: true,
    message,
    data,
  });
}
