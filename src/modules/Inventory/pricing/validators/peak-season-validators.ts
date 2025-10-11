import { z } from "zod";

export const createPeakSeasonValidator = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),

  startDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid startDate format",
  }),

  endDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid endDate format",
  }),

  changeType: z.enum(["increase", "decrease"] as const, {
    message: "changeType must be either 'increase' or 'decrease'",
  }),

  changeValue: z
    .number()
    .min(0, { message: "changeValue must be non-negative" }),

  applyToAllProperties: z.boolean().refine((val) => typeof val === "boolean", {
    message: "applyToAllProperties must be a boolean",
  }),

  propertyIds: z
    .array(z.number().int().positive({ message: "Invalid property ID" }))
    .optional(),
});

export const updatePeakSeasonValidator = createPeakSeasonValidator.partial();

export type CreatePeakSeasonValidatorType = z.infer<
  typeof createPeakSeasonValidator
>;
export type UpdatePeakSeasonValidatorType = z.infer<
  typeof updatePeakSeasonValidator
>;
