import { Response } from "express";

export function errHandle(
  res: Response,
  message: string,
  statusCode: number = 500,
  error?: unknown
) {
  let errorMessage: string | null = null;
  let errors: any = null;

  if (error instanceof Error) {
    errorMessage = error.message;
  } else if (typeof error === "string") {
    errorMessage = error;
  } else if (Array.isArray(error)) {
    // Handle validation errors array
    errors = error;
    errorMessage = null;
  }

  return res.status(statusCode).json({
    status: false,
    message,
    error: errorMessage,
    errors: errors
  });
}
