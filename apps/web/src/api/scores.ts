import type {
  MatchFilters,
  MatchesState,
  PatchMatchInput,
  ScoreMatch,
} from "../types/scores";
import { apiRequest } from "./client";

function matchesPath(tournamentSlug: string, stageSlug: string): string {
  return `/tournaments/${encodeURIComponent(tournamentSlug)}/stages/${encodeURIComponent(stageSlug)}/matches`;
}

function buildQuery(filters: MatchFilters): string {
  const params = new URLSearchParams();

  if (filters.player) {
    params.set("player", filters.player);
  }
  if (filters.hour_slot) {
    params.set("hour_slot", filters.hour_slot);
  }
  if (filters.tbl) {
    params.set("tbl", filters.tbl);
  }

  const query = params.toString();
  return query ? `?${query}` : "";
}

export function listMatches(
  tournamentSlug: string,
  stageSlug: string,
  filters: MatchFilters = { player: "", hour_slot: "", tbl: "" },
): Promise<MatchesState> {
  return apiRequest<MatchesState>(
    `${matchesPath(tournamentSlug, stageSlug)}${buildQuery(filters)}`,
  );
}

export function patchMatch(
  tournamentSlug: string,
  stageSlug: string,
  slno: number,
  input: PatchMatchInput,
): Promise<ScoreMatch> {
  return apiRequest<ScoreMatch>(
    `${matchesPath(tournamentSlug, stageSlug)}/${slno}`,
    {
      method: "PATCH",
      body: JSON.stringify(input),
    },
  );
}

export function completeMatch(
  tournamentSlug: string,
  stageSlug: string,
  slno: number,
): Promise<ScoreMatch> {
  return apiRequest<ScoreMatch>(
    `${matchesPath(tournamentSlug, stageSlug)}/${slno}/complete`,
    {
      method: "POST",
    },
  );
}