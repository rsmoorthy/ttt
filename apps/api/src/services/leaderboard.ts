import { parseScore } from "./score-validation";

const GAME_FIELDS = ["game1", "game2", "game3", "game4", "game5"] as const;

export interface LeaderboardMatch {
  player1: string;
  player2: string;
  game1: string;
  game2: string;
  game3: string;
  game4: string;
  game5: string;
  walkover_win: string;
  is_completed: boolean;
}

export interface LeaderboardEntry {
  rank: number;
  player_name: string;
  played: number;
  wins: number;
  nrr: number;
  swlr: number;
  pwlr: number;
}

interface PlayerStats {
  played: number;
  wins: number;
  setsWon: number;
  setsLost: number;
  pointsWon: number;
  pointsLost: number;
}

function roundTo(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function reverseScore(score: string): string {
  const parsed = parseScore(score);
  if (!parsed) {
    return score;
  }
  return `${parsed.n2}-${parsed.n1}`;
}

function getRelativeScores(
  player: string,
  match: LeaderboardMatch,
): string[] {
  const games = GAME_FIELDS.map((field) => match[field]).filter(
    (score) => score !== "",
  );

  if (match.player1 === player) {
    return games;
  }

  if (match.player2 === player) {
    return games.map(reverseScore);
  }

  return [];
}

function matchHasResults(match: LeaderboardMatch): boolean {
  if (match.walkover_win !== "") {
    return true;
  }

  return GAME_FIELDS.some((field) => match[field] !== "");
}

function playerWonMatch(player: string, match: LeaderboardMatch): boolean {
  if (match.walkover_win !== "") {
    return match.walkover_win === player;
  }

  const relativeScores = getRelativeScores(player, match);
  if (relativeScores.length === 0) {
    return false;
  }

  let setsWon = 0;
  let setsLost = 0;

  for (const score of relativeScores) {
    const parsed = parseScore(score);
    if (!parsed) {
      continue;
    }

    if (parsed.n1 > parsed.n2) {
      setsWon += 1;
    } else if (parsed.n1 < parsed.n2) {
      setsLost += 1;
    }
  }

  return setsWon > setsLost;
}

function accumulateSetAndPointStats(
  player: string,
  match: LeaderboardMatch,
  stats: PlayerStats,
): void {
  if (match.walkover_win !== "") {
    return;
  }

  for (const score of getRelativeScores(player, match)) {
    const parsed = parseScore(score);
    if (!parsed) {
      continue;
    }

    if (parsed.n1 > parsed.n2) {
      stats.setsWon += 1;
    } else if (parsed.n1 < parsed.n2) {
      stats.setsLost += 1;
    }

    stats.pointsWon += parsed.n1;
    stats.pointsLost += parsed.n2;
  }
}

function computeSwlr(stats: PlayerStats): number {
  if (stats.setsLost === 0) {
    return stats.setsWon === 0 ? 0 : 99;
  }

  return roundTo(stats.setsWon / stats.setsLost, 2);
}

function computePwlr(stats: PlayerStats): number {
  if (stats.pointsLost === 0) {
    return stats.pointsWon === 0 ? 0 : 99;
  }

  return roundTo(stats.pointsWon / stats.pointsLost, 2);
}

function computeNrr(swlr: number, pwlr: number): number {
  return roundTo((swlr * 100 + pwlr) / 100, 4);
}

function collectPlayers(matches: LeaderboardMatch[]): string[] {
  const players = new Set<string>();
  for (const match of matches) {
    players.add(match.player1);
    players.add(match.player2);
  }
  return [...players];
}

export function computeLeaderboard(
  matches: LeaderboardMatch[],
): LeaderboardEntry[] {
  const players = collectPlayers(matches);
  const statsByPlayer = new Map<string, PlayerStats>();

  for (const player of players) {
    statsByPlayer.set(player, {
      played: 0,
      wins: 0,
      setsWon: 0,
      setsLost: 0,
      pointsWon: 0,
      pointsLost: 0,
    });
  }

  for (const match of matches) {
    if (match.is_completed) {
      for (const player of [match.player1, match.player2]) {
        const stats = statsByPlayer.get(player);
        if (stats) {
          stats.played += 1;
        }
      }
    }

    if (!matchHasResults(match)) {
      continue;
    }

    for (const player of [match.player1, match.player2]) {
      const stats = statsByPlayer.get(player);
      if (!stats) {
        continue;
      }

      if (playerWonMatch(player, match)) {
        stats.wins += 1;
      }

      accumulateSetAndPointStats(player, match, stats);
    }
  }

  const entries = players.map((player_name) => {
    const stats = statsByPlayer.get(player_name)!;
    const swlr = computeSwlr(stats);
    const pwlr = computePwlr(stats);
    const nrr = computeNrr(swlr, pwlr);

    return {
      rank: 0,
      player_name,
      played: stats.played,
      wins: stats.wins,
      nrr,
      swlr,
      pwlr,
    };
  });

  entries.sort((a, b) => {
    if (b.wins !== a.wins) {
      return b.wins - a.wins;
    }
    if (b.nrr !== a.nrr) {
      return b.nrr - a.nrr;
    }
    return a.player_name.localeCompare(b.player_name);
  });

  return entries.map((entry, index) => ({
    ...entry,
    rank: index + 1,
  }));
}