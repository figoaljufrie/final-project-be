// src/modules/user/validators/user-validator.ts
import { z } from "zod";

export const updateEmailValidator = z.object({
  email: z
    .email({ message: "Invalid email format" })
    .min(5, { message: "Email must be at least 5 characters long" }),
});

export const updateUserValidator = z.object({
  name: z
    .string()
    .min(2, { message: "Name must be at least 2 characters" })
    .optional(),
  phoneNumber: z
    .string()
    .regex(/^[0-9+]+$/, {
      message: "Phone number must contain only numbers and +",
    })
    .min(8, { message: "Phone number too short" })
    .max(15, { message: "Phone number too long" })
    .optional(),
  address: z.string().min(5, { message: "Address too short" }).optional(),
  city: z
    .string()
    .min(2, { message: "City must be at least 2 characters" })
    .optional(),
  country: z
    .string()
    .min(2, { message: "Country must be at least 2 characters" })
    .optional(),
  dateOfBirth: z
    .string()
    .refine((date) => !isNaN(Date.parse(date)), {
      message: "Invalid date format",
    })
    .optional(),
  avatarUrl: z
    .string()
    .url({ message: "Invalid avatar URL format" })
    .optional(),
});

export const updatePasswordValidator = z.object({
  currentPassword: z
    .string()
    .min(8, { message: "Current password must be at least 8 characters" }),
  newPassword: z
    .string()
    .min(8, { message: "New password must be at least 8 characters" })
    .regex(/[A-Z]/, {
      message: "New password must contain at least one uppercase letter",
    })
    .regex(/[0-9]/, {
      message: "New password must contain at least one number",
    }),
});
