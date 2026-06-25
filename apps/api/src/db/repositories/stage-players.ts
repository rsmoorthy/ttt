import { getDb } from "../connection";
import type { RegistrationPlayer } from "./registration";
import { listRegistration } from "./registration";

export type PlayerSource = "registration" | "stages_players";

export function listStagePlayers(
  tournament: string,
  stage: string,
): RegistrationPlayer[] {
  const db = getDb();
  return db
    .prepare(
      `SELECT player_name, sort_order
       FROM stages_players
       WHERE tournament = ? AND stage = ?
       ORDER BY sort_order ASC`,
    )
    .all(tournament, stage) as RegistrationPlayer[];
}

export function resolveStagePlayers(
  tournament: string,
  stage: string,
): { source: PlayerSource; players: RegistrationPlayer[] } {
  const movedPlayers = listStagePlayers(tournament, stage);
  if (movedPlayers.length > 0) {
    return { source: "stages_players", players: movedPlayers };
  }

  return {
    source: "registration",
    players: listRegistration(tournament),
  };
}