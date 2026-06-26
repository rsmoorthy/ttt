export interface MatchScoreState {
  game1: string;
  game2: string;
  game3: string;
  game4: string;
  game5: string;
  walkover_win: string;
}

const GAME_FIELDS = ["game1", "game2", "game3", "game4", "game5"] as const;

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

export function validateScoreString(
  score: string,
  field: string,
): string | null {
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
    const error = validateScoreString(state[field], field);
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
    fields.walkover_win =
      "Walkover cannot be set when game scores are present";
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