import { z } from "zod";
import { HttpError } from "../middleware/error-handler";

const playerEntrySchema = z.union([
  z.string(),
  z.object({
    player_name: z.string(),
  }),
]);

export const replaceRegistrationSchema = z.object({
  players: z.array(playerEntrySchema),
});

export type ReplaceRegistrationInput = z.infer<
  typeof replaceRegistrationSchema
>;

export function normalizeRegistrationPlayers(
  players: ReplaceRegistrationInput["players"],
): { player_name: string; sort_order: number }[] {
  const normalized: { player_name: string; sort_order: number }[] = [];

  for (let index = 0; index < players.length; index += 1) {
    const entry = players[index];

    if (typeof entry === "string") {
      const name = entry.trim();
      if (name === "") {
        continue;
      }
      normalized.push({ player_name: name, sort_order: normalized.length });
      continue;
    }

    const name = entry.player_name.trim();
    if (name === "") {
      throw new HttpError(400, "Validation failed", {
        [`players.${index}.player_name`]: "Player name cannot be empty",
      });
    }

    normalized.push({ player_name: name, sort_order: normalized.length });
  }

  if (normalized.length > 30) {
    throw new HttpError(400, "Validation failed", {
      players: "Maximum 30 players allowed",
    });
  }

  return normalized;
}