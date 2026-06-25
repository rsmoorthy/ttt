import { z } from "zod";

const slugSchema = z
  .string()
  .min(1, "Slug is required")
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Slug must be lowercase alphanumeric with hyphens",
  );

const statusSchema = z.enum(["open", "closed"]);

export const createTournamentSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: slugSchema,
  description: z.string().optional().default(""),
  status: statusSchema.optional().default("open"),
});

export const updateTournamentSchema = z
  .object({
    name: z.string().min(1, "Name cannot be empty").optional(),
    description: z.string().optional(),
    status: statusSchema.optional(),
  })
  .refine(
    (value) =>
      value.name !== undefined ||
      value.description !== undefined ||
      value.status !== undefined,
    { message: "At least one field is required" },
  );

export type CreateTournamentInput = z.infer<typeof createTournamentSchema>;
export type UpdateTournamentInput = z.infer<typeof updateTournamentSchema>;