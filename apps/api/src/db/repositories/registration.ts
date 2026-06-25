import { getDb } from "../connection";

export interface RegistrationPlayer {
  player_name: string;
  sort_order: number;
}

export function listRegistration(tournament: string): RegistrationPlayer[] {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT player_name, sort_order
       FROM registration
       WHERE tournament = ?
       ORDER BY sort_order ASC`,
    )
    .all(tournament) as RegistrationPlayer[];

  return rows;
}

export function replaceRegistration(
  tournament: string,
  players: RegistrationPlayer[],
): RegistrationPlayer[] {
  const db = getDb();

  const replaceAll = db.transaction((entries: RegistrationPlayer[]) => {
    db.prepare("DELETE FROM registration WHERE tournament = ?").run(tournament);

    const insert = db.prepare(
      `INSERT INTO registration (tournament, player_name, sort_order)
       VALUES (?, ?, ?)`,
    );

    for (const player of entries) {
      insert.run(tournament, player.player_name, player.sort_order);
    }
  });

  replaceAll(players);
  return listRegistration(tournament);
}