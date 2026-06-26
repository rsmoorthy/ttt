import { http, HttpResponse } from "msw";
import {
  mockSuperadmin,
  sampleRegistrationPlayers,
  sampleStages,
  sampleTournaments,
} from "./data";
import { hasMinimumRole } from "../../src/constants/navigation";
import type { AuthUser, UserRole } from "../../src/types/auth";
import type { RegisteredPlayer } from "../../src/types/registration";
import type {
  FixtureMatchRow,
  FixtureSummary,
} from "../../src/types/fixtures";
import type { Stage, StageType } from "../../src/types/stage";
import type { Tournament } from "../../src/types/tournament";
import {
  hasScoreContent,
  matchScoreState,
  validateMatchScores,
} from "../../src/utils/scores";
import { computeLeaderboard } from "../../../api/src/services/leaderboard";

interface StoredMatchRow extends FixtureMatchRow {
  tbl?: number | null;
  hour_slot?: number | null;
  game1?: string;
  game2?: string;
  game3?: string;
  game4?: string;
  game5?: string;
  walkover_win?: string;
  is_completed?: boolean;
}

interface StoredFixtures {
  groups: Record<string, string[]>;
  matches: StoredMatchRow[];
  summary: FixtureSummary;
}

let fixturesByStage: Record<string, StoredFixtures> = {};
let stagePlayersByStage: Record<string, RegisteredPlayer[]> = {};

let currentUser: AuthUser = mockSuperadmin;
let tournaments: Tournament[] = [...sampleTournaments];
let registrations: Record<string, RegisteredPlayer[]> = {
  "summer-open-2026": [...sampleRegistrationPlayers],
  "winter-league": [],
};
let stagesByTournament: Record<string, Stage[]> = {
  "summer-open-2026": [...sampleStages],
  "winter-league": [],
};

function normalizePlayers(players: string[]): RegisteredPlayer[] {
  const normalized: RegisteredPlayer[] = [];

  for (const entry of players) {
    const name = entry.trim();
    if (name === "") {
      continue;
    }
    normalized.push({
      player_name: name,
      sort_order: normalized.length,
    });
    if (normalized.length > 30) {
      break;
    }
  }

  return normalized;
}

function tournamentExists(slug: string): boolean {
  return tournaments.some((item) => item.slug === slug);
}

function stageKey(tournamentSlug: string, stageSlug: string): string {
  return `${tournamentSlug}/${stageSlug}`;
}

function findStageRecord(
  tournamentSlug: string,
  stageSlug: string,
): Stage | undefined {
  return stagesByTournament[tournamentSlug]?.find(
    (item) => item.slug === stageSlug,
  );
}

function createEmptyMatch(
  slno: number,
  player1: string,
  player2: string,
): StoredMatchRow {
  return {
    slno,
    player1,
    player2,
    tbl: null,
    hour_slot: null,
    game1: "",
    game2: "",
    game3: "",
    game4: "",
    game5: "",
    walkover_win: "",
    is_completed: false,
  };
}

function buildMockMatchSummary(matches: StoredMatchRow[]) {
  return {
    completed_matches: matches.filter((match) => match.is_completed).length,
    total_matches: matches.length,
  };
}

function toScheduleMatchResponse(match: StoredMatchRow) {
  return {
    slno: match.slno,
    player1: match.player1,
    player2: match.player2,
    tbl: match.tbl ?? null,
    hour_slot: match.hour_slot ?? null,
    is_completed: Boolean(match.is_completed),
  };
}

function toScoreMatchResponse(match: StoredMatchRow) {
  return {
    slno: match.slno,
    player1: match.player1,
    player2: match.player2,
    tbl: match.tbl ?? null,
    hour_slot: match.hour_slot ?? null,
    game1: match.game1 ?? "",
    game2: match.game2 ?? "",
    game3: match.game3 ?? "",
    game4: match.game4 ?? "",
    game5: match.game5 ?? "",
    walkover_win: match.walkover_win ?? "",
    is_completed: Boolean(match.is_completed),
  };
}

function compareStoredMatches(left: StoredMatchRow, right: StoredMatchRow): number {
  const leftHour = left.hour_slot ?? Number.MAX_SAFE_INTEGER;
  const rightHour = right.hour_slot ?? Number.MAX_SAFE_INTEGER;
  if (leftHour !== rightHour) {
    return leftHour - rightHour;
  }

  const leftTable = left.tbl ?? Number.MAX_SAFE_INTEGER;
  const rightTable = right.tbl ?? Number.MAX_SAFE_INTEGER;
  if (leftTable !== rightTable) {
    return leftTable - rightTable;
  }

  return left.slno - right.slno;
}

function buildScoreFilterOptions(matches: StoredMatchRow[]) {
  const players = new Set<string>();
  const hourSlots = new Set<number>();
  const tbls = new Set<number>();

  for (const match of matches) {
    players.add(match.player1);
    players.add(match.player2);
    if (match.hour_slot != null) {
      hourSlots.add(match.hour_slot);
    }
    if (match.tbl != null) {
      tbls.add(match.tbl);
    }
  }

  return {
    players: [...players].sort(),
    hour_slots: [...hourSlots].sort((left, right) => left - right),
    tbls: [...tbls].sort((left, right) => left - right),
  };
}

function matchPassesScoreFilters(
  match: StoredMatchRow,
  filters: { player?: string; hour_slot?: number; tbl?: number },
): boolean {
  if (
    filters.player &&
    match.player1 !== filters.player &&
    match.player2 !== filters.player
  ) {
    return false;
  }

  if (filters.hour_slot !== undefined && match.hour_slot !== filters.hour_slot) {
    return false;
  }

  if (filters.tbl !== undefined && match.tbl !== filters.tbl) {
    return false;
  }

  return true;
}

function findStoredMatch(
  tournamentSlug: string,
  stageSlug: string,
  slno: number,
): StoredMatchRow | undefined {
  return fixturesByStage[stageKey(tournamentSlug, stageSlug)]?.matches.find(
    (match) => match.slno === slno,
  );
}

function generateMockFixtures(
  playerNames: string[],
  stageType: StageType,
): StoredFixtures {
  if (stageType === "playoff" && playerNames.length === 2) {
    const matches = [
      createEmptyMatch(1, playerNames[0], playerNames[1]),
    ];
    return {
      groups: {},
      matches,
      summary: { total_matches: 1, matches_per_player: 1 },
    };
  }

  const matches: StoredMatchRow[] = [];
  let slno = 1;
  for (let i = 0; i < playerNames.length; i += 1) {
    for (let j = i + 1; j < playerNames.length; j += 1) {
      matches.push(createEmptyMatch(slno++, playerNames[i], playerNames[j]));
    }
  }

  return {
    groups: { A: playerNames },
    matches,
    summary: {
      total_matches: matches.length,
      matches_per_player:
        playerNames.length > 0
          ? Math.round((matches.length * 2) / playerNames.length)
          : 0,
    },
  };
}

export function resetMockState() {
  currentUser = mockSuperadmin;
  tournaments = [...sampleTournaments];
  registrations = {
    "summer-open-2026": [...sampleRegistrationPlayers],
    "winter-league": [],
  };
  stagesByTournament = {
    "summer-open-2026": [...sampleStages],
    "winter-league": [],
  };
  fixturesByStage = {};
  stagePlayersByStage = {};
}

export function setMockUser(user: AuthUser) {
  currentUser = user;
}

function toLeaderboardMatch(match: StoredMatchRow) {
  return {
    player1: match.player1,
    player2: match.player2,
    game1: match.game1 ?? "",
    game2: match.game2 ?? "",
    game3: match.game3 ?? "",
    game4: match.game4 ?? "",
    game5: match.game5 ?? "",
    walkover_win: match.walkover_win ?? "",
  };
}

export function seedLeagueFixtures(
  tournamentSlug = "summer-open-2026",
  stageSlug = "league",
  options?: { scheduled?: boolean; scored?: boolean },
) {
  const stage = findStageRecord(tournamentSlug, stageSlug);
  if (!stage) {
    return;
  }

  const playerNames = (registrations[tournamentSlug] ?? []).map(
    (player) => player.player_name,
  );
  if (playerNames.length === 0) {
    return;
  }

  const generated = generateMockFixtures(playerNames, stage.stage_type);
  let matches = options?.scheduled
    ? assignMockSchedule(generated.matches, 2, 2)
    : generated.matches;

  if (options?.scored) {
    matches = matches.map((match, index) =>
      index === 0
        ? {
            ...match,
            game1: "11-7",
            game2: "11-5",
            is_completed: true,
          }
        : match,
    );
  }

  fixturesByStage[stageKey(tournamentSlug, stageSlug)] = {
    ...generated,
    matches,
  };
}

function assignMockSchedule(
  matches: StoredMatchRow[],
  numSlots: number,
  numTables: number,
): StoredMatchRow[] {
  return matches.map((match, index) => ({
    ...match,
    hour_slot: (index % numSlots) + 1,
    tbl: (index % numTables) + 1,
  }));
}

export const handlers = [
  http.get("/api/auth/me", () => HttpResponse.json(currentUser)),

  http.get("/api/tournaments", () =>
    HttpResponse.json({ tournaments: [...tournaments] }),
  ),

  http.get("/api/tournaments/:slug", ({ params }) => {
    const tournament = tournaments.find((item) => item.slug === params.slug);
    if (!tournament) {
      return HttpResponse.json({ error: "Tournament not found" }, { status: 404 });
    }
    return HttpResponse.json(tournament);
  }),

  http.get("/api/tournaments/:slug/registration", ({ params }) => {
    const slug = String(params.slug);
    if (!tournamentExists(slug)) {
      return HttpResponse.json({ error: "Tournament not found" }, { status: 404 });
    }

    return HttpResponse.json({
      tournament: slug,
      players: [...(registrations[slug] ?? [])],
    });
  }),

  http.put("/api/tournaments/:slug/registration", async ({ params, request }) => {
    const slug = String(params.slug);
    if (!tournamentExists(slug)) {
      return HttpResponse.json({ error: "Tournament not found" }, { status: 404 });
    }

    const body = (await request.json()) as { players: string[] };
    const saved = normalizePlayers(body.players ?? []);
    registrations[slug] = saved;

    return HttpResponse.json({
      tournament: slug,
      players: saved,
    });
  }),

  http.get("/api/tournaments/:slug/stages", ({ params }) => {
    const slug = String(params.slug);
    if (!tournamentExists(slug)) {
      return HttpResponse.json({ error: "Tournament not found" }, { status: 404 });
    }

    return HttpResponse.json({
      tournament: slug,
      stages: [...(stagesByTournament[slug] ?? [])],
    });
  }),

  http.get("/api/tournaments/:slug/stages/:stage", ({ params }) => {
    const tournamentSlug = String(params.slug);
    const stageSlug = String(params.stage);
    if (!tournamentExists(tournamentSlug)) {
      return HttpResponse.json({ error: "Tournament not found" }, { status: 404 });
    }

    const stage = stagesByTournament[tournamentSlug]?.find(
      (item) => item.slug === stageSlug,
    );
    if (!stage) {
      return HttpResponse.json({ error: "Stage not found" }, { status: 404 });
    }

    return HttpResponse.json({
      tournament: tournamentSlug,
      ...stage,
    });
  }),

  http.post("/api/tournaments/:slug/stages", async ({ params, request }) => {
    const tournamentSlug = String(params.slug);
    if (!tournamentExists(tournamentSlug)) {
      return HttpResponse.json({ error: "Tournament not found" }, { status: 404 });
    }

    const body = (await request.json()) as Stage;
    const existing = stagesByTournament[tournamentSlug] ?? [];

    if (existing.some((item) => item.slug === body.slug)) {
      return HttpResponse.json(
        { error: "Stage slug already exists for this tournament" },
        { status: 409 },
      );
    }

    const created: Stage = {
      slug: body.slug,
      name: body.name,
      description: body.description ?? "",
      stage_type: body.stage_type ?? "league",
      is_completed: body.is_completed ?? false,
    };

    stagesByTournament[tournamentSlug] = [...existing, created];
    return HttpResponse.json(created, { status: 201 });
  }),

  http.put("/api/tournaments/:slug/stages/:stage", async ({ params, request }) => {
    const tournamentSlug = String(params.slug);
    const stageSlug = String(params.stage);
    if (!tournamentExists(tournamentSlug)) {
      return HttpResponse.json({ error: "Tournament not found" }, { status: 404 });
    }

    const existing = stagesByTournament[tournamentSlug] ?? [];
    const index = existing.findIndex((item) => item.slug === stageSlug);
    if (index === -1) {
      return HttpResponse.json({ error: "Stage not found" }, { status: 404 });
    }

    const body = (await request.json()) as Partial<Stage>;
    const updated: Stage = {
      ...existing[index],
      ...body,
      slug: existing[index].slug,
    };
    stagesByTournament[tournamentSlug] = [
      ...existing.slice(0, index),
      updated,
      ...existing.slice(index + 1),
    ];

    return HttpResponse.json({
      tournament: tournamentSlug,
      ...updated,
    });
  }),

  http.get("/api/tournaments/:slug/stages/:stage/fixtures", ({ params }) => {
    const tournamentSlug = String(params.slug);
    const stageSlug = String(params.stage);
    const stage = findStageRecord(tournamentSlug, stageSlug);

    if (!tournamentExists(tournamentSlug)) {
      return HttpResponse.json({ error: "Tournament not found" }, { status: 404 });
    }
    if (!stage) {
      return HttpResponse.json({ error: "Stage not found" }, { status: 404 });
    }

    const players = registrations[tournamentSlug] ?? [];
    const stored = fixturesByStage[stageKey(tournamentSlug, stageSlug)];

    return HttpResponse.json({
      tournament: tournamentSlug,
      stage: stageSlug,
      stage_type: stage.stage_type,
      players,
      player_source: "registration",
      has_fixtures: Boolean(stored),
      groups: stored?.groups ?? {},
      matches: stored?.matches ?? [],
      summary: stored?.summary ?? null,
    });
  }),

  http.post(
    "/api/tournaments/:slug/stages/:stage/fixtures",
    async ({ params, request }) => {
      const tournamentSlug = String(params.slug);
      const stageSlug = String(params.stage);
      const stage = findStageRecord(tournamentSlug, stageSlug);

      if (!tournamentExists(tournamentSlug)) {
        return HttpResponse.json({ error: "Tournament not found" }, { status: 404 });
      }
      if (!stage) {
        return HttpResponse.json({ error: "Stage not found" }, { status: 404 });
      }

      const players = registrations[tournamentSlug] ?? [];
      const playerNames = players.map((player) => player.player_name);

      if (playerNames.length === 0) {
        return HttpResponse.json(
          { error: "No players available for fixture generation" },
          { status: 400 },
        );
      }

      if (stage.stage_type === "superleague" && playerNames.length !== 8) {
        return HttpResponse.json(
          { error: "Super league requires exactly 8 players" },
          { status: 400 },
        );
      }

      const body = (await request.json().catch(() => ({}))) as {
        approx_total_matches?: number;
      };

      if (stage.stage_type === "league" && !body.approx_total_matches) {
        return HttpResponse.json(
          { error: "Validation failed", fields: { approx_total_matches: "Required" } },
          { status: 400 },
        );
      }

      const generated = generateMockFixtures(playerNames, stage.stage_type);
      fixturesByStage[stageKey(tournamentSlug, stageSlug)] = generated;

      return HttpResponse.json({
        tournament: tournamentSlug,
        stage: stageSlug,
        stage_type: stage.stage_type,
        total_matches: generated.summary.total_matches,
        matches_per_player: generated.summary.matches_per_player,
        groups: generated.groups,
        matches: generated.matches,
      });
    },
  ),

  http.get("/api/tournaments/:slug/stages/:stage/schedule", ({ params }) => {
    const tournamentSlug = String(params.slug);
    const stageSlug = String(params.stage);
    const stage = findStageRecord(tournamentSlug, stageSlug);

    if (!tournamentExists(tournamentSlug)) {
      return HttpResponse.json({ error: "Tournament not found" }, { status: 404 });
    }
    if (!stage) {
      return HttpResponse.json({ error: "Stage not found" }, { status: 404 });
    }

    const stored = fixturesByStage[stageKey(tournamentSlug, stageSlug)];
    if (!stored) {
      return HttpResponse.json(
        { error: "Create fixtures before scheduling" },
        { status: 409 },
      );
    }

    return HttpResponse.json({
      tournament: tournamentSlug,
      stage: stageSlug,
      stage_type: stage.stage_type,
      has_fixtures: true,
      matches: stored.matches.map(toScheduleMatchResponse),
      match_summary: buildMockMatchSummary(stored.matches),
    });
  }),

  http.post(
    "/api/tournaments/:slug/stages/:stage/schedule",
    async ({ params, request }) => {
      const tournamentSlug = String(params.slug);
      const stageSlug = String(params.stage);
      const stage = findStageRecord(tournamentSlug, stageSlug);

      if (!tournamentExists(tournamentSlug)) {
        return HttpResponse.json({ error: "Tournament not found" }, { status: 404 });
      }
      if (!stage) {
        return HttpResponse.json({ error: "Stage not found" }, { status: 404 });
      }

      if (stage.stage_type !== "league") {
        return HttpResponse.json(
          { error: "Automated scheduling is only available for league stages" },
          { status: 400 },
        );
      }

      const key = stageKey(tournamentSlug, stageSlug);
      const stored = fixturesByStage[key];
      if (!stored) {
        return HttpResponse.json(
          { error: "No fixtures to schedule" },
          { status: 409 },
        );
      }

      const body = (await request.json()) as {
        numSlots?: number;
        numTables?: number;
        maxMatchesPerSlot?: number;
      };

      const numSlots = body.numSlots ?? 7;
      const numTables = body.numTables ?? 2;
      const scheduledMatches = assignMockSchedule(
        stored.matches,
        numSlots,
        numTables,
      );
      fixturesByStage[key] = {
        ...stored,
        matches: scheduledMatches,
      };

      return HttpResponse.json({
        tournament: tournamentSlug,
        stage: stageSlug,
        matches: scheduledMatches.map((match) => ({
          player1: match.player1,
          player2: match.player2,
          hour_slot: match.hour_slot!,
          tbl: match.tbl!,
        })),
      });
    },
  ),

  http.get("/api/tournaments/:slug/stages/:stage/matches", ({ params, request }) => {
    const tournamentSlug = String(params.slug);
    const stageSlug = String(params.stage);

    if (!tournamentExists(tournamentSlug)) {
      return HttpResponse.json({ error: "Tournament not found" }, { status: 404 });
    }
    if (!findStageRecord(tournamentSlug, stageSlug)) {
      return HttpResponse.json({ error: "Stage not found" }, { status: 404 });
    }

    const url = new URL(request.url);
    const player = url.searchParams.get("player") ?? undefined;
    const hourSlotRaw = url.searchParams.get("hour_slot");
    const tblRaw = url.searchParams.get("tbl");
    const hour_slot =
      hourSlotRaw && hourSlotRaw !== ""
        ? Number(hourSlotRaw)
        : undefined;
    const tbl = tblRaw && tblRaw !== "" ? Number(tblRaw) : undefined;

    const stored = fixturesByStage[stageKey(tournamentSlug, stageSlug)];
    const allMatches = stored?.matches ?? [];
    const filterOptions = buildScoreFilterOptions(allMatches);
    const matches = allMatches
      .filter((match) =>
        matchPassesScoreFilters(match, { player, hour_slot, tbl }),
      )
      .sort(compareStoredMatches)
      .map(toScoreMatchResponse);

    return HttpResponse.json({
      tournament: tournamentSlug,
      stage: stageSlug,
      filters: {
        player: player ?? null,
        hour_slot: hour_slot ?? null,
        tbl: tbl ?? null,
      },
      matches,
      filter_options: filterOptions,
      match_summary: buildMockMatchSummary(allMatches),
    });
  }),

  http.patch(
    "/api/tournaments/:slug/stages/:stage/matches/:slno",
    async ({ params, request }) => {
      const tournamentSlug = String(params.slug);
      const stageSlug = String(params.stage);
      const slno = Number(params.slno);
      const role = currentUser.role as UserRole;

      if (!hasMinimumRole(role, "scorer")) {
        return HttpResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      if (!tournamentExists(tournamentSlug)) {
        return HttpResponse.json({ error: "Tournament not found" }, { status: 404 });
      }
      if (!findStageRecord(tournamentSlug, stageSlug)) {
        return HttpResponse.json({ error: "Stage not found" }, { status: 404 });
      }

      const match = findStoredMatch(tournamentSlug, stageSlug, slno);
      if (!match) {
        return HttpResponse.json({ error: "Match not found" }, { status: 404 });
      }

      if (match.is_completed && !hasMinimumRole(role, "admin")) {
        return HttpResponse.json(
          { error: "Cannot update a completed match" },
          { status: 403 },
        );
      }

      const body = (await request.json()) as Partial<StoredMatchRow>;
      const nextState = {
        game1: body.game1 ?? match.game1 ?? "",
        game2: body.game2 ?? match.game2 ?? "",
        game3: body.game3 ?? match.game3 ?? "",
        game4: body.game4 ?? match.game4 ?? "",
        game5: body.game5 ?? match.game5 ?? "",
        walkover_win: body.walkover_win ?? match.walkover_win ?? "",
      };

      const fieldErrors = validateMatchScores(
        nextState,
        match.player1,
        match.player2,
      );
      if (fieldErrors) {
        return HttpResponse.json(
          { error: "Score validation failed", fields: fieldErrors },
          { status: 400 },
        );
      }

      const key = stageKey(tournamentSlug, stageSlug);
      const stored = fixturesByStage[key];
      if (!stored) {
        return HttpResponse.json({ error: "Match not found" }, { status: 404 });
      }

      fixturesByStage[key] = {
        ...stored,
        matches: stored.matches.map((item) =>
          item.slno === slno
            ? {
                ...item,
                ...nextState,
              }
            : item,
        ),
      };

      return HttpResponse.json(
        toScoreMatchResponse(findStoredMatch(tournamentSlug, stageSlug, slno)!),
      );
    },
  ),

  http.post(
    "/api/tournaments/:slug/stages/:stage/move-players",
    async ({ params, request }) => {
      const tournamentSlug = String(params.slug);
      const sourceStageSlug = String(params.stage);
      const role = currentUser.role as UserRole;

      if (!hasMinimumRole(role, "admin")) {
        return HttpResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      if (!tournamentExists(tournamentSlug)) {
        return HttpResponse.json({ error: "Tournament not found" }, { status: 404 });
      }
      if (!findStageRecord(tournamentSlug, sourceStageSlug)) {
        return HttpResponse.json({ error: "Stage not found" }, { status: 404 });
      }

      const body = (await request.json()) as {
        target_stage?: string;
        players?: string[];
      };
      const targetStageSlug = body.target_stage ?? "";
      const players = body.players ?? [];

      if (targetStageSlug === "") {
        return HttpResponse.json(
          { error: "Validation failed", fields: { target_stage: "Required" } },
          { status: 400 },
        );
      }

      if (players.length === 0) {
        return HttpResponse.json(
          { error: "Validation failed", fields: { players: "Required" } },
          { status: 400 },
        );
      }

      if (targetStageSlug === sourceStageSlug) {
        return HttpResponse.json(
          { error: "target_stage must differ from source stage" },
          { status: 409 },
        );
      }

      if (!findStageRecord(tournamentSlug, targetStageSlug)) {
        return HttpResponse.json({ error: "Target stage not found" }, { status: 404 });
      }

      const saved = players.map((player_name, sort_order) => ({
        player_name,
        sort_order,
      }));
      stagePlayersByStage[stageKey(tournamentSlug, targetStageSlug)] = saved;

      return HttpResponse.json({
        tournament: tournamentSlug,
        source_stage: sourceStageSlug,
        target_stage: targetStageSlug,
        players: saved,
      });
    },
  ),

  http.get("/api/tournaments/:slug/stages/:stage/leaderboard", ({ params }) => {
    const tournamentSlug = String(params.slug);
    const stageSlug = String(params.stage);

    if (!tournamentExists(tournamentSlug)) {
      return HttpResponse.json({ error: "Tournament not found" }, { status: 404 });
    }
    if (!findStageRecord(tournamentSlug, stageSlug)) {
      return HttpResponse.json({ error: "Stage not found" }, { status: 404 });
    }

    const stored = fixturesByStage[stageKey(tournamentSlug, stageSlug)];
    const matches = stored?.matches ?? [];
    const entries = computeLeaderboard(matches.map(toLeaderboardMatch));

    return HttpResponse.json({
      tournament: tournamentSlug,
      stage: stageSlug,
      entries,
    });
  }),

  http.post(
    "/api/tournaments/:slug/stages/:stage/matches/:slno/complete",
    ({ params }) => {
      const tournamentSlug = String(params.slug);
      const stageSlug = String(params.stage);
      const slno = Number(params.slno);
      const role = currentUser.role as UserRole;

      if (!hasMinimumRole(role, "scorer")) {
        return HttpResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      if (!tournamentExists(tournamentSlug)) {
        return HttpResponse.json({ error: "Tournament not found" }, { status: 404 });
      }
      if (!findStageRecord(tournamentSlug, stageSlug)) {
        return HttpResponse.json({ error: "Stage not found" }, { status: 404 });
      }

      const match = findStoredMatch(tournamentSlug, stageSlug, slno);
      if (!match) {
        return HttpResponse.json({ error: "Match not found" }, { status: 404 });
      }

      if (match.is_completed) {
        return HttpResponse.json(
          { error: "Match is already completed" },
          { status: 409 },
        );
      }

      const scoreState = matchScoreState(toScoreMatchResponse(match));
      if (!hasScoreContent(scoreState)) {
        return HttpResponse.json(
          { error: "Cannot complete match without scores or walkover" },
          { status: 400 },
        );
      }

      const fieldErrors = validateMatchScores(
        scoreState,
        match.player1,
        match.player2,
      );
      if (fieldErrors) {
        return HttpResponse.json(
          { error: "Score validation failed", fields: fieldErrors },
          { status: 400 },
        );
      }

      const key = stageKey(tournamentSlug, stageSlug);
      const stored = fixturesByStage[key];
      if (!stored) {
        return HttpResponse.json({ error: "Match not found" }, { status: 404 });
      }

      fixturesByStage[key] = {
        ...stored,
        matches: stored.matches.map((item) =>
          item.slno === slno ? { ...item, is_completed: true } : item,
        ),
      };

      return HttpResponse.json(
        toScoreMatchResponse(findStoredMatch(tournamentSlug, stageSlug, slno)!),
      );
    },
  ),

  http.delete("/api/tournaments/:slug/stages/:stage", ({ params }) => {
    const tournamentSlug = String(params.slug);
    const stageSlug = String(params.stage);
    if (!tournamentExists(tournamentSlug)) {
      return HttpResponse.json({ error: "Tournament not found" }, { status: 404 });
    }

    const existing = stagesByTournament[tournamentSlug] ?? [];
    const next = existing.filter((item) => item.slug !== stageSlug);
    if (next.length === existing.length) {
      return HttpResponse.json({ error: "Stage not found" }, { status: 404 });
    }

    stagesByTournament[tournamentSlug] = next;
    delete fixturesByStage[stageKey(tournamentSlug, stageSlug)];
    return new HttpResponse(null, { status: 204 });
  }),

  http.post("/api/tournaments", async ({ request }) => {
    const body = (await request.json()) as Tournament;
    if (tournaments.some((item) => item.slug === body.slug)) {
      return HttpResponse.json(
        { error: "Tournament slug already exists" },
        { status: 409 },
      );
    }
    const created: Tournament = {
      slug: body.slug,
      name: body.name,
      description: body.description ?? "",
      status: body.status ?? "open",
    };
    tournaments.push(created);
    registrations[created.slug] = [];
    stagesByTournament[created.slug] = [];
    return HttpResponse.json(created, { status: 201 });
  }),

  http.put("/api/tournaments/:slug", async ({ params, request }) => {
    const index = tournaments.findIndex((item) => item.slug === params.slug);
    if (index === -1) {
      return HttpResponse.json({ error: "Tournament not found" }, { status: 404 });
    }
    const body = (await request.json()) as Partial<Tournament>;
    tournaments[index] = {
      ...tournaments[index],
      ...body,
      slug: tournaments[index].slug,
    };
    return HttpResponse.json(tournaments[index]);
  }),

  http.delete("/api/tournaments/:slug", ({ params }) => {
    const slug = String(params.slug);
    const before = tournaments.length;
    tournaments = tournaments.filter((item) => item.slug !== slug);
    delete registrations[slug];
    delete stagesByTournament[slug];
    if (tournaments.length === before) {
      return HttpResponse.json({ error: "Tournament not found" }, { status: 404 });
    }
    return new HttpResponse(null, { status: 204 });
  }),

  http.post("/api/auth/logout", () => new HttpResponse(null, { status: 204 })),
];