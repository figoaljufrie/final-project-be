import { z } from "zod";

export const registerSchema = z.object({
  email: z.email("Invalid email format"),
});

export const loginSchema = z.object({
  email: z.email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
});

export const resendVerificationSchema = z.object({
  email: z.email("Invalid email format"),
});

export const forgotPasswordSchema = z.object({
  email: z.email("Invalid email format"),
});

export const verifyEmailAndSetPasswordSchema = z.object({
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .regex(/[A-Z]/, "Must contain at least one uppercase letter")
    .regex(/[0-9]/, "Must contain at least one number"),
});

export const resetPasswordSchema = z.object({
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .regex(/[A-Z]/, "Must contain at least one uppercase letter")
    .regex(/[0-9]/, "Must contain at least one number"),
});
