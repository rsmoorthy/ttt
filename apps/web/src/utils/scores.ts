import type { UserRole } from "../types/auth";
import type { PatchMatchInput, ScoreMatch } from "../types/scores";
import { hasMinimumRole } from "../constants/navigation";

export interface MatchScoreState {
  game1: string;
  game2: string;
  game3: string;
  game4: string;
  game5: string;
  walkover_win: string;
}

export const GAME_FIELDS = [
  "game1",
  "game2",
  "game3",
  "game4",
  "game5",
] as const;

export type GameField = (typeof GAME_FIELDS)[number];

export const FILTER_EMPTY_OPTION = "—select—";

export const INVALID_SCORE_MESSAGE = "Invalid score. Please correct it";

export const WALKOVER_WITH_SCORES_MESSAGE =
  "Cannot set Walkover Win, when game scores are present. Empty the scores and set Walkover Win";

export function invalidScoreAlertMessage(
  slno: number,
  field: string,
  fieldErrors: Record<string, string>,
): string {
  if (field === "walkover_win") {
    const walkoverError = fieldErrors[fieldErrorKey(slno, "walkover_win")];
    if (walkoverError === WALKOVER_WITH_SCORES_MESSAGE) {
      return WALKOVER_WITH_SCORES_MESSAGE;
    }
  }

  return INVALID_SCORE_MESSAGE;
}

export function matchScoreState(match: ScoreMatch): MatchScoreState {
  return {
    game1: match.game1,
    game2: match.game2,
    game3: match.game3,
    game4: match.game4,
    game5: match.game5,
    walkover_win: match.walkover_win,
  };
}

export function parseScore(
  score: string,
): { n1: number; n2: number } | null {
  const match = /^(\d+)-(\d+)$/.exec(score.trim());
  if (!match) {
    return null;
  }

  return {
    n1: Number(match[1]),
    n2: Number(match[2]),
  };
}

export function validateScoreString(score: string): string | null {
  if (score === "") {
    return null;
  }

  const parsed = parseScore(score);
  if (!parsed) {
    return "Invalid score format (expected n1-n2)";
  }

  const { n1, n2 } = parsed;
  if (n1 < 0 || n2 < 0) {
    return "Scores must be non-negative integers";
  }

  if (n1 < 11 && n2 < 11) {
    return "At least one score must be 11 or greater";
  }

  const diff = Math.abs(n1 - n2);

  if (n1 <= 11 && n2 <= 11) {
    if (diff < 2) {
      return "Winner must lead by at least 2 when both scores are 11 or less";
    }
    return null;
  }

  if (n1 > 10 && n2 > 10 && diff !== 2) {
    return "Difference must be exactly 2 when both scores are greater than 10";
  }

  return null;
}

export function hasScoreContent(state: MatchScoreState): boolean {
  if (state.walkover_win !== "") {
    return true;
  }

  return GAME_FIELDS.some((field) => state[field] !== "");
}

export function validateMatchScores(
  state: MatchScoreState,
  player1: string,
  player2: string,
): Record<string, string> | null {
  const fields: Record<string, string> = {};

  for (const field of GAME_FIELDS) {
    const error = validateScoreString(state[field]);
    if (error) {
      fields[field] = error;
    }
  }

  for (let index = 1; index < GAME_FIELDS.length; index += 1) {
    const field = GAME_FIELDS[index];
    if (state[field] !== "") {
      for (let prior = 0; prior < index; prior += 1) {
        const priorField = GAME_FIELDS[prior];
        if (state[priorField] === "") {
          fields[field] = `Cannot set ${field} before ${priorField}`;
          break;
        }
      }
    }
  }

  const hasGames = GAME_FIELDS.some((field) => state[field] !== "");
  const hasWalkover = state.walkover_win !== "";

  if (hasWalkover && hasGames) {
    fields.walkover_win = WALKOVER_WITH_SCORES_MESSAGE;
    for (const field of GAME_FIELDS) {
      if (state[field] !== "") {
        fields[field] = "Game scores cannot be set when walkover is selected";
      }
    }
  }

  if (
    hasWalkover &&
    state.walkover_win !== player1 &&
    state.walkover_win !== player2
  ) {
    fields.walkover_win = "Walkover winner must be player1 or player2";
  }

  return Object.keys(fields).length > 0 ? fields : null;
}

export function canEditMatch(role: UserRole, match: ScoreMatch): boolean {
  if (!hasMinimumRole(role, "scorer")) {
    return false;
  }

  if (match.is_completed && !hasMinimumRole(role, "admin")) {
    return false;
  }

  return true;
}

export const REQUIRED_GAMES_FOR_MATCH_OVER = ["game1", "game2"] as const;

export function hasValidRequiredGames(state: MatchScoreState): boolean {
  return REQUIRED_GAMES_FOR_MATCH_OVER.every(
    (field) => state[field] !== "" && validateScoreString(state[field]) === null,
  );
}

export function getCompletedMatchWinner(
  state: MatchScoreState,
  player1: string,
  player2: string,
): string | null {
  if (state.walkover_win !== "") {
    return state.walkover_win;
  }

  const { player1Wins, player2Wins } = countGamesWon(state);

  if (player1Wins > player2Wins) {
    return player1;
  }

  if (player2Wins > player1Wins) {
    return player2;
  }

  return null;
}

export function countGamesWon(state: MatchScoreState): {
  player1Wins: number;
  player2Wins: number;
} {
  let player1Wins = 0;
  let player2Wins = 0;

  for (const field of GAME_FIELDS) {
    const score = state[field];
    if (score === "") {
      continue;
    }

    const parsed = parseScore(score);
    if (!parsed) {
      continue;
    }

    if (parsed.n1 > parsed.n2) {
      player1Wins += 1;
    } else if (parsed.n2 > parsed.n1) {
      player2Wins += 1;
    }
  }

  return { player1Wins, player2Wins };
}

export function hasDecisiveGameWins(state: MatchScoreState): boolean {
  const { player1Wins, player2Wins } = countGamesWon(state);
  return player1Wins !== player2Wins;
}

export function canCompleteMatchState(state: MatchScoreState): boolean {
  if (state.walkover_win !== "") {
    return true;
  }

  if (!hasValidRequiredGames(state)) {
    return false;
  }

  return hasDecisiveGameWins(state);
}

export function canCompleteMatch(
  role: UserRole,
  match: ScoreMatch,
  state?: MatchScoreState,
): boolean {
  if (!hasMinimumRole(role, "scorer")) {
    return false;
  }

  if (match.is_completed) {
    return false;
  }

  return canCompleteMatchState(state ?? matchScoreState(match));
}

export function mergeMatchPatch(
  match: ScoreMatch,
  patch: PatchMatchInput,
): MatchScoreState {
  return {
    game1: patch.game1 ?? match.game1,
    game2: patch.game2 ?? match.game2,
    game3: patch.game3 ?? match.game3,
    game4: patch.game4 ?? match.game4,
    game5: patch.game5 ?? match.game5,
    walkover_win: patch.walkover_win ?? match.walkover_win,
  };
}

export function fieldErrorKey(slno: number, field: string): string {
  return `${slno}:${field}`;
}

export function scoreFieldId(
  slno: number,
  field: string,
  context: "table" | "modal" = "table",
): string {
  return `score-${context}-${slno}-${field}`;
}

export function scoreInputClassName(
  hasError: boolean,
  extra = "",
): string {
  const base =
    "rounded-md border px-2 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 disabled:bg-slate-50";
  return hasError
    ? `${base} border-red-500 focus:border-red-500 focus:ring-red-500 ${extra}`.trim()
    : `${base} border-slate-300 focus:border-brand-500 focus:ring-brand-500 ${extra}`.trim();
}