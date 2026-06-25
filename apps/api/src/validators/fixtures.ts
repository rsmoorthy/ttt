import { z } from "zod";

export const createFixturesSchema = z.object({
  approx_total_matches: z
    .number()
    .int()
    .positive("approx_total_matches must be greater than 0")
    .optional(),
});

export type CreateFixturesInput = z.infer<typeof createFixturesSchema>;