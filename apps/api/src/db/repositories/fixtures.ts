import { getDb } from "../connection";

export interface FixtureMatch {
  slno: number;
  player1: string;
  player2: string;
  table: number | null;
  hour_slot: number | null;
  game1: string;
  game2: string;
  game3: string;
  game4: string;
  game5: string;
  walkover_win: string;
  is_completed: boolean;
}

interface FixtureRow {
  slno: number;
  player1: string;
  player2: string;
  table_num: number | null;
  hour_slot: number | null;
  game1: string;
  game2: string;
  game3: string;
  game4: string;
  game5: string;
  walkover_win: string;
  is_completed: number;
}

interface FixtureGroupRow {
  group_name: string;
  player_name: string;
  sort_order: number;
}

function toFixtureMatch(row: FixtureRow): FixtureMatch {
  return {
    slno: row.slno,
    player1: row.player1,
    player2: row.player2,
    table: row.table_num,
    hour_slot: row.hour_slot,
    game1: row.game1 ?? "",
    game2: row.game2 ?? "",
    game3: row.game3 ?? "",
    game4: row.game4 ?? "",
    game5: row.game5 ?? "",
    walkover_win: row.walkover_win ?? "",
    is_completed: row.is_completed === 1,
  };
}

export function listFixtureGroups(
  tournament: string,
  stage: string,
): Record<string, string[]> {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT group_name, player_name, sort_order
       FROM fixture_groups
       WHERE tournament = ? AND stage = ?
       ORDER BY group_name ASC, sort_order ASC`,
    )
    .all(tournament, stage) as FixtureGroupRow[];

  const groups: Record<string, string[]> = {};
  for (const row of rows) {
    if (!groups[row.group_name]) {
      groups[row.group_name] = [];
    }
    groups[row.group_name].push(row.player_name);
  }

  return groups;
}

export function listFixtureMatches(
  tournament: string,
  stage: string,
): FixtureMatch[] {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT slno, player1, player2, table_num, hour_slot,
              game1, game2, game3, game4, game5, walkover_win, is_completed
       FROM fixtures
       WHERE tournament = ? AND stage = ?
       ORDER BY slno ASC`,
    )
    .all(tournament, stage) as FixtureRow[];

  return rows.map(toFixtureMatch);
}

export function hasFixtures(tournament: string, stage: string): boolean {
  const db = getDb();
  const row = db
    .prepare(
      "SELECT COUNT(*) AS count FROM fixtures WHERE tournament = ? AND stage = ?",
    )
    .get(tournament, stage) as { count: number };

  return row.count > 0;
}

export function computeFixtureSummary(
  matches: FixtureMatch[],
  playerNames: string[],
): { total_matches: number; matches_per_player: number } | null {
  if (matches.length === 0) {
    return null;
  }

  const counts = new Map<string, number>();
  for (const name of playerNames) {
    counts.set(name, 0);
  }

  for (const match of matches) {
    counts.set(match.player1, (counts.get(match.player1) ?? 0) + 1);
    counts.set(match.player2, (counts.get(match.player2) ?? 0) + 1);
  }

  const matchesPerPlayer = Math.max(0, ...counts.values());

  return {
    total_matches: matches.length,
    matches_per_player: matchesPerPlayer,
  };
}

export function replaceFixtures(
  tournament: string,
  stage: string,
  groups: Record<string, string[]>,
  matches: Array<{ slno: number; player1: string; player2: string }>,
): FixtureMatch[] {
  const db = getDb();

  const replaceAll = db.transaction(() => {
    db.prepare("DELETE FROM fixtures WHERE tournament = ? AND stage = ?").run(
      tournament,
      stage,
    );
    db.prepare(
      "DELETE FROM fixture_groups WHERE tournament = ? AND stage = ?",
    ).run(tournament, stage);

    const insertGroup = db.prepare(
      `INSERT INTO fixture_groups (tournament, stage, group_name, player_name, sort_order)
       VALUES (?, ?, ?, ?, ?)`,
    );

    for (const [groupName, players] of Object.entries(groups)) {
      players.forEach((playerName, index) => {
        insertGroup.run(tournament, stage, groupName, playerName, index);
      });
    }

    const insertMatch = db.prepare(
      `INSERT INTO fixtures (tournament, stage, slno, player1, player2)
       VALUES (?, ?, ?, ?, ?)`,
    );

    for (const match of matches) {
      insertMatch.run(
        tournament,
        stage,
        match.slno,
        match.player1,
        match.player2,
      );
    }
  });

  replaceAll();
  return listFixtureMatches(tournament, stage);
}