// src/modules/Account/oauth/validators/oAuth-validator.ts
import { z } from "zod";

export const socialLoginValidator = z.object({
  idToken: z
    .string()
    .min(10, { message: "Invalid idToken format or missing idToken" }),

  provider: z
    .string()
    .refine(
      (val) =>
        ["google", "facebook", "apple", "github"].includes(val.toLowerCase()),
      {
        message: "Provider must be one of: google, facebook, apple, github",
      }
    ),
});
