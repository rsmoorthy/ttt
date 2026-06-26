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

export function replaceStagePlayers(
  tournament: string,
  stage: string,
  players: string[],
): RegistrationPlayer[] {
  const db = getDb();

  const replaceAll = db.transaction(() => {
    db.prepare(
      "DELETE FROM stages_players WHERE tournament = ? AND stage = ?",
    ).run(tournament, stage);

    const insert = db.prepare(
      `INSERT INTO stages_players (tournament, stage, player_name, sort_order)
       VALUES (?, ?, ?, ?)`,
    );

    players.forEach((playerName, index) => {
      insert.run(tournament, stage, playerName, index);
    });
  });

  replaceAll();
  return listStagePlayers(tournament, stage);
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