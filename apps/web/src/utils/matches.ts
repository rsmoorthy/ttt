export interface MatchCompletionCounts {
  completed: number;
  total: number;
}

export function countMatchCompletion(
  matches: Array<{ is_completed: boolean }>,
): MatchCompletionCounts {
  return {
    completed: matches.filter((match) => match.is_completed).length,
    total: matches.length,
  };
}

export function formatMatchDescription(match: {
  slno: number;
  player1: string;
  player2: string;
}): string {
  return `${match.slno}. ${match.player1} vs ${match.player2}`;
}