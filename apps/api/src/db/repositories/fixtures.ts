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
  tbl: number | null;
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
    table: row.tbl,
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
      `SELECT slno, player1, player2, tbl, hour_slot,
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

export interface ScheduleMatchView {
  slno: number;
  player1: string;
  player2: string;
  tbl: number | null;
  hour_slot: number | null;
  is_completed: boolean;
}

export interface MatchSummary {
  completed_matches: number;
  total_matches: number;
}

export function buildMatchSummary(
  matches: Array<{ is_completed: boolean }>,
): MatchSummary {
  return {
    completed_matches: matches.filter((match) => match.is_completed).length,
    total_matches: matches.length,
  };
}

export function toScheduleMatchView(match: FixtureMatch): ScheduleMatchView {
  return {
    slno: match.slno,
    player1: match.player1,
    player2: match.player2,
    tbl: match.table,
    hour_slot: match.hour_slot,
    is_completed: match.is_completed,
  };
}

export function listScheduleMatches(
  tournament: string,
  stage: string,
): ScheduleMatchView[] {
  return listFixtureMatches(tournament, stage).map(toScheduleMatchView);
}

export function applySchedule(
  tournament: string,
  stage: string,
  scheduled: Array<{
    player1: string;
    player2: string;
    hour_slot: number;
    tbl: number;
  }>,
): ScheduleMatchView[] {
  const db = getDb();

  const applyAll = db.transaction(() => {
    const update = db.prepare(
      `UPDATE fixtures
       SET tbl = ?, hour_slot = ?
       WHERE tournament = ? AND stage = ? AND player1 = ? AND player2 = ?`,
    );

    for (const match of scheduled) {
      const result = update.run(
        match.tbl,
        match.hour_slot,
        tournament,
        stage,
        match.player1,
        match.player2,
      );

      if (result.changes === 0) {
        throw new Error(
          `No fixture found for ${match.player1} vs ${match.player2}`,
        );
      }
    }
  });

  applyAll();
  return listScheduleMatches(tournament, stage);
}

export interface MatchResponse {
  slno: number;
  player1: string;
  player2: string;
  tbl: number | null;
  hour_slot: number | null;
  game1: string;
  game2: string;
  game3: string;
  game4: string;
  game5: string;
  walkover_win: string;
  is_completed: boolean;
}

export interface MatchFilters {
  player?: string;
  hour_slot?: number;
  tbl?: number;
}

export interface MatchFilterOptions {
  players: string[];
  hour_slots: number[];
  tbls: number[];
}

export function toMatchResponse(match: FixtureMatch): MatchResponse {
  return {
    slno: match.slno,
    player1: match.player1,
    player2: match.player2,
    tbl: match.table,
    hour_slot: match.hour_slot,
    game1: match.game1,
    game2: match.game2,
    game3: match.game3,
    game4: match.game4,
    game5: match.game5,
    walkover_win: match.walkover_win,
    is_completed: match.is_completed,
  };
}

function compareMatchesForSort(a: FixtureMatch, b: FixtureMatch): number {
  const aHour = a.hour_slot ?? Number.MAX_SAFE_INTEGER;
  const bHour = b.hour_slot ?? Number.MAX_SAFE_INTEGER;
  if (aHour !== bHour) {
    return aHour - bHour;
  }

  const aTable = a.table ?? Number.MAX_SAFE_INTEGER;
  const bTable = b.table ?? Number.MAX_SAFE_INTEGER;
  if (aTable !== bTable) {
    return aTable - bTable;
  }

  return a.slno - b.slno;
}

function matchPassesFilters(match: FixtureMatch, filters: MatchFilters): boolean {
  if (filters.player && match.player1 !== filters.player && match.player2 !== filters.player) {
    return false;
  }

  if (filters.hour_slot !== undefined && match.hour_slot !== filters.hour_slot) {
    return false;
  }

  if (filters.tbl !== undefined && match.table !== filters.tbl) {
    return false;
  }

  return true;
}

export function buildMatchFilterOptions(matches: FixtureMatch[]): MatchFilterOptions {
  const players = new Set<string>();
  const hourSlots = new Set<number>();
  const tbls = new Set<number>();

  for (const match of matches) {
    players.add(match.player1);
    players.add(match.player2);
    if (match.hour_slot !== null) {
      hourSlots.add(match.hour_slot);
    }
    if (match.table !== null) {
      tbls.add(match.table);
    }
  }

  return {
    players: [...players].sort(),
    hour_slots: [...hourSlots].sort((a, b) => a - b),
    tbls: [...tbls].sort((a, b) => a - b),
  };
}

export function listMatches(
  tournament: string,
  stage: string,
  filters: MatchFilters = {},
): {
  matches: MatchResponse[];
  filter_options: MatchFilterOptions;
  match_summary: MatchSummary;
} {
  const allMatches = listFixtureMatches(tournament, stage);
  const filterOptions = buildMatchFilterOptions(allMatches);
  const matches = allMatches
    .filter((match) => matchPassesFilters(match, filters))
    .sort(compareMatchesForSort)
    .map(toMatchResponse);

  return {
    matches,
    filter_options: filterOptions,
    match_summary: buildMatchSummary(allMatches),
  };
}

export function findMatch(
  tournament: string,
  stage: string,
  slno: number,
): FixtureMatch | undefined {
  const db = getDb();
  const row = db
    .prepare(
      `SELECT slno, player1, player2, tbl, hour_slot,
              game1, game2, game3, game4, game5, walkover_win, is_completed
       FROM fixtures
       WHERE tournament = ? AND stage = ? AND slno = ?`,
    )
    .get(tournament, stage, slno) as FixtureRow | undefined;

  return row ? toFixtureMatch(row) : undefined;
}

export type MatchScoreUpdate = Partial<
  Pick<
    FixtureMatch,
    "game1" | "game2" | "game3" | "game4" | "game5" | "walkover_win"
  >
>;

export function updateMatchScores(
  tournament: string,
  stage: string,
  slno: number,
  updates: MatchScoreUpdate,
): MatchResponse | undefined {
  const existing = findMatch(tournament, stage, slno);
  if (!existing) {
    return undefined;
  }

  const nextState = {
    game1: updates.game1 ?? existing.game1,
    game2: updates.game2 ?? existing.game2,
    game3: updates.game3 ?? existing.game3,
    game4: updates.game4 ?? existing.game4,
    game5: updates.game5 ?? existing.game5,
    walkover_win: updates.walkover_win ?? existing.walkover_win,
  };

  const db = getDb();
  db.prepare(
    `UPDATE fixtures
     SET game1 = ?, game2 = ?, game3 = ?, game4 = ?, game5 = ?, walkover_win = ?
     WHERE tournament = ? AND stage = ? AND slno = ?`,
  ).run(
    nextState.game1,
    nextState.game2,
    nextState.game3,
    nextState.game4,
    nextState.game5,
    nextState.walkover_win,
    tournament,
    stage,
    slno,
  );

  return toMatchResponse(findMatch(tournament, stage, slno)!);
}

export function completeMatch(
  tournament: string,
  stage: string,
  slno: number,
): MatchResponse | undefined {
  const existing = findMatch(tournament, stage, slno);
  if (!existing) {
    return undefined;
  }

  const db = getDb();
  db.prepare(
    `UPDATE fixtures
     SET is_completed = 1
     WHERE tournament = ? AND stage = ? AND slno = ?`,
  ).run(tournament, stage, slno);

  return toMatchResponse(findMatch(tournament, stage, slno)!);
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
