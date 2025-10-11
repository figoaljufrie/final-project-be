import { z } from "zod";

export const setAvailabilityValidator = z.object({
  date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid date format",
  }),

  isAvailable: z
    .boolean()
    .optional()
    .refine((val) => val === undefined || typeof val === "boolean", {
      message: "isAvailable must be a boolean",
    }),

  customPrice: z
    .union([z.number().nonnegative(), z.null()])
    .optional()
    .refine(
      (val) => val === null || val === undefined || typeof val === "number",
      {
        message: "customPrice must be a number or null",
      }
    ),

  priceModifier: z
    .union([z.number(), z.null()])
    .optional()
    .refine(
      (val) =>
        val === null ||
        val === undefined ||
        (typeof val === "number" && val >= -100 && val <= 1000),
      {
        message: "priceModifier must be between -100 and 1000",
      }
    ),

  reason: z
    .union([z.string().max(255), z.null()])
    .optional()
    .refine(
      (val) => val === null || val === undefined || typeof val === "string",
      {
        message: "Reason must be a string or null",
      }
    ),
});

export type SetAvailabilityValidatorType = z.infer<
  typeof setAvailabilityValidator
>;
