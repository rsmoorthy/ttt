import { z } from "zod";

export const movePlayersSchema = z.object({
  target_stage: z.string().min(1, "target_stage is required"),
  players: z
    .array(z.string().min(1, "Player name cannot be empty"))
    .min(1, "At least one player is required"),
});

export type MovePlayersInput = z.infer<typeof movePlayersSchema>;