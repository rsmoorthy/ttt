import type { LeaderboardState } from "../types/leaderboard";
import { apiRequest } from "./client";

function leaderboardPath(tournamentSlug: string, stageSlug: string): string {
  return `/tournaments/${encodeURIComponent(tournamentSlug)}/stages/${encodeURIComponent(stageSlug)}/leaderboard`;
}

export function getLeaderboard(
  tournamentSlug: string,
  stageSlug: string,
): Promise<LeaderboardState> {
  return apiRequest<LeaderboardState>(
    leaderboardPath(tournamentSlug, stageSlug),
  );
}