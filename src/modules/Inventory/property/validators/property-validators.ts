import { z } from "zod";
import { $Enums } from "../../../../generated/prisma";

const PropertyCategoryEnum = z.enum(
  Object.values($Enums.PropertyCategory) as [string, ...string[]]
);

// 🔹 Reusable helpers
const baseString = z.string().trim().min(1, { message: "Field is required" });
const optionalString = z.string().trim().optional();

export const createPropertySchema = z.object({
  name: baseString.max(100, { message: "Name too long" }),
  description: z.string().optional(),
  category: PropertyCategoryEnum,
});

export const updatePropertySchema = z.object({
  name: z
    .string()
    .trim()
    .max(100, "Name cannot exceed 100 characters")
    .optional(),
  description: optionalString,
  category: PropertyCategoryEnum.optional(),
  city: optionalString,
  province: optionalString,
  address: optionalString,
  images: z.any().optional(),
});

export const propertySearchSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),

  name: optionalString,
  category: PropertyCategoryEnum.optional(),

  checkInDate: z
    .string()
    .optional()
    .refine((val) => !val || !isNaN(Date.parse(val)), {
      message: "Invalid checkInDate format",
    }),

  checkOutDate: z
    .string()
    .optional()
    .refine((val) => !val || !isNaN(Date.parse(val)), {
      message: "Invalid checkOutDate format",
    }),

  sortBy: z
    .enum(["name", "createdAt", "price"])
    .optional()
    .default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

export const propertyCalendarSchema = z.object({
  month: z.coerce.number().min(1).max(12).optional(),
  year: z.coerce.number().min(2000).max(2100).optional(),
});

export const propertyIdSchema = z.object({
  id: z.coerce.number().int().positive({ message: "Invalid property ID" }),
});

export type CreatePropertySchema = z.infer<typeof createPropertySchema>;
export type UpdatePropertySchema = z.infer<typeof updatePropertySchema>;
export type PropertySearchSchema = z.infer<typeof propertySearchSchema>;
export type PropertyCalendarSchema = z.infer<typeof propertyCalendarSchema>;
export type PropertyIdSchema = z.infer<typeof propertyIdSchema>;
