import { z } from "zod";
import { STAGE_TYPES } from "../constants/stage-types";

const slugSchema = z
  .string()
  .min(1, "Slug is required")
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Slug must be lowercase alphanumeric with hyphens",
  );

const stageTypeSchema = z.enum(STAGE_TYPES);

export const createStageSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: slugSchema,
  description: z.string().optional().default(""),
  stage_type: stageTypeSchema.optional().default("league"),
  is_completed: z.boolean().optional().default(false),
});

export const updateStageSchema = z
  .object({
    name: z.string().min(1, "Name cannot be empty").optional(),
    description: z.string().optional(),
    stage_type: stageTypeSchema.optional(),
    is_completed: z.boolean().optional(),
  })
  .refine(
    (value) =>
      value.name !== undefined ||
      value.description !== undefined ||
      value.stage_type !== undefined ||
      value.is_completed !== undefined,
    { message: "At least one field is required" },
  );

export type CreateStageInput = z.infer<typeof createStageSchema>;
export type UpdateStageInput = z.infer<typeof updateStageSchema>;