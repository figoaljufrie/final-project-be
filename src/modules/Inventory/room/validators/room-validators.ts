import { z } from "zod";

const baseString = z.string().trim().min(1, { message: "Field is required" });
const optionalString = z
  .string()
  .trim()
  .max(1000, { message: "Too long" })
  .optional();
const positiveNumber = z.coerce.number().int().positive({
  message: "Must be a positive number",
});

export const roomImageMetadataSchema = z.object({
  isPrimary: z.boolean().optional().default(false),
  order: z.number().int().nonnegative().optional().default(0),
  altText: z.string().optional().default(""),
});

export const createRoomSchema = z.object({
  propertyId: positiveNumber,
  name: baseString.max(100, { message: "Name too long" }),
  capacity: positiveNumber.max(1000, { message: "Capacity too large" }),
  basePrice: positiveNumber.max(100000000, {
    message: "Base price too high",
  }),
  totalUnits: z.coerce.number().int().positive().optional().default(1),
  description: optionalString,
  imageMeta: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val) return true;
        try {
          const parsed = JSON.parse(val);
          return Array.isArray(parsed);
        } catch {
          return false;
        }
      },
      { message: "Invalid imageMeta format. Must be JSON array." }
    ),
});

export const updateRoomSchema = z.object({
  name: z.string().trim().max(100, { message: "Name too long" }).optional(),
  capacity: z.coerce.number().int().positive().optional(),
  basePrice: z.coerce.number().int().positive().optional(),
  totalUnits: z.coerce.number().int().positive().optional(),
  description: optionalString,
  imageMeta: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val) return true;
        try {
          const parsed = JSON.parse(val);
          return Array.isArray(parsed);
        } catch {
          return false;
        }
      },
      { message: "Invalid imageMeta format. Must be JSON array." }
    ),
});

export const roomParamsSchema = z.object({
  propertyId: positiveNumber,
  roomId: positiveNumber.optional(),
});

export type CreateRoomSchema = z.infer<typeof createRoomSchema>;
export type UpdateRoomSchema = z.infer<typeof updateRoomSchema>;
export type RoomParamsSchema = z.infer<typeof roomParamsSchema>;
