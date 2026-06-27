import { z } from "zod";

const scoreField = z.string().optional();

export const patchMatchSchema = z
  .object({
    game1: scoreField,
    game2: scoreField,
    game3: scoreField,
    game4: scoreField,
    game5: scoreField,
    walkover_win: scoreField,
  })
  .refine(
    (body) =>
      body.game1 !== undefined ||
      body.game2 !== undefined ||
      body.game3 !== undefined ||
      body.game4 !== undefined ||
      body.game5 !== undefined ||
      body.walkover_win !== undefined,
    { message: "At least one field must be provided" },
  );

export type PatchMatchInput = z.infer<typeof patchMatchSchema>;

export const listMatchesQuerySchema = z.object({
  player: z.string().optional(),
  hour_slot: z.coerce.number().int().positive().optional(),
  completion: z.enum(["pending", "completed"]).optional(),
});

export type ListMatchesQuery = z.infer<typeof listMatchesQuerySchema>;