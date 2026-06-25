import type { StageType } from "../constants/stage-types";

export class FixtureGenerationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FixtureGenerationError";
  }
}

export interface FixtureMatch {
  slno: number;
  player1: string;
  player2: string;
}

export interface FixtureGenerationResult {
  total_matches: number;
  matches_per_player: number;
  groups: Record<string, string[]>;
  matches: FixtureMatch[];
}

interface Group {
  name: string;
  size: number;
  players: string[];
}

interface RawMatch {
  p1: string;
  p2: string;
  typeLabel: string;
}

const GROUP_LETTERS = ["A", "B", "C", "D", "E", "F"];

function getGroupSizes(n: number, g: number): number[] {
  const base = Math.floor(n / g);
  const rem = n % g;
  const sizes = new Array<number>(g).fill(base);
  for (let i = 0; i < rem; i++) {
    sizes[i]++;
  }
  return sizes;
}

export function shufflePlayers<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function buildGroups(players: string[], g: number): Group[] {
  const sizes = getGroupSizes(players.length, g);
  const remaining = [...players];
  const groups: Group[] = [];

  for (let i = 0; i < g; i++) {
    const letter = GROUP_LETTERS[i];
    const groupPlayers = remaining.splice(0, sizes[i]);
    groups.push({
      name: letter,
      size: sizes[i],
      players: groupPlayers,
    });
  }

  return groups;
}

function computeIntraTotal(groups: Group[]): number {
  let total = 0;
  for (const group of groups) {
    total += (group.size * (group.size - 1)) / 2;
  }
  return total;
}

function findBestTAndKs(
  groups: Group[],
  targetTotal: number,
): { bestT: number; kPerGroup: number[]; totalMatches: number } {
  const groupSizes = groups.map((group) => group.size);
  const minIntra = Math.max(...groupSizes.map((size) => size - 1));
  const maxT = groups.reduce((sum, group) => sum + group.size, 0) - 1;

  let bestT: number | null = null;
  let bestDiff = Infinity;
  let bestKPerGroup: number[] | null = null;
  let bestTotalMatches = 0;

  for (let t = minIntra; t <= maxT; t++) {
    const kValues: number[] = [];
    let feasible = true;
    let totalInterWeight = 0;

    for (let i = 0; i < groupSizes.length; i++) {
      const intra = groupSizes[i] - 1;
      const k = t - intra;
      if (k < 0) {
        feasible = false;
        break;
      }
      const maxOpponents = groupSizes.reduce((sum, size) => sum + size, 0) - groupSizes[i];
      if (k > maxOpponents) {
        feasible = false;
        break;
      }
      kValues.push(k);
      totalInterWeight += groupSizes[i] * k;
    }

    if (!feasible) {
      continue;
    }
    if (totalInterWeight % 2 !== 0) {
      continue;
    }

    const totalMatches = computeIntraTotal(groups) + totalInterWeight / 2;
    const diff = Math.abs(totalMatches - targetTotal);
    if (diff < bestDiff) {
      bestDiff = diff;
      bestT = t;
      bestKPerGroup = kValues;
      bestTotalMatches = totalMatches;
    }
  }

  if (bestT === null || bestKPerGroup === null) {
    throw new FixtureGenerationError(
      "No feasible matches-per-player plan for this group layout",
    );
  }

  return {
    bestT,
    kPerGroup: bestKPerGroup,
    totalMatches: bestTotalMatches,
  };
}

function shuffleArray<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const r = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[r]] = [arr[r], arr[i]];
  }
  return arr;
}

interface IndexedPlayer {
  name: string;
  groupIdx: number;
  groupName: string;
}

function buildIndexedPlayers(groups: Group[]): IndexedPlayer[] {
  const allPlayers: IndexedPlayer[] = [];
  for (let gi = 0; gi < groups.length; gi++) {
    for (const player of groups[gi].players) {
      allPlayers.push({
        name: player,
        groupIdx: gi,
        groupName: groups[gi].name,
      });
    }
  }
  return allPlayers;
}

function interMatchesFromSet(
  allPlayers: IndexedPlayer[],
  matchSet: Set<string>,
): RawMatch[] {
  const interMatches: RawMatch[] = [];
  for (const key of matchSet) {
    const [i, j] = key.split(",").map(Number);
    interMatches.push({
      p1: allPlayers[i].name,
      p2: allPlayers[j].name,
      typeLabel: `${allPlayers[i].groupName}-${allPlayers[j].groupName}`,
    });
  }
  return interMatches;
}

function tryRandomInterMatches(
  allPlayers: IndexedPlayer[],
  required: number[],
  candidates: number[][],
): RawMatch[] | null {
  const n = allPlayers.length;
  const matchSet = new Set<string>();
  const curRequired = [...required];
  const order = shuffleArray([...Array(n).keys()]);

  for (const idx of order) {
    if (curRequired[idx] === 0) {
      continue;
    }
    const need = curRequired[idx];
    const possible = candidates[idx].filter((opp) => {
      if (curRequired[opp] === 0) {
        return false;
      }
      const a = Math.min(idx, opp);
      const b = Math.max(idx, opp);
      return !matchSet.has(`${a},${b}`);
    });

    if (possible.length < need) {
      return null;
    }

    shuffleArray(possible);
    for (let t = 0; t < need; t++) {
      const opp = possible[t];
      const a = Math.min(idx, opp);
      const b = Math.max(idx, opp);
      matchSet.add(`${a},${b}`);
      curRequired[idx]--;
      curRequired[opp]--;
    }
  }

  if (!curRequired.every((value) => value === 0)) {
    return null;
  }

  return interMatchesFromSet(allPlayers, matchSet);
}

function tryDeterministicInterMatches(
  allPlayers: IndexedPlayer[],
  required: number[],
  candidates: number[][],
): RawMatch[] | null {
  const n = allPlayers.length;
  const matchSet = new Set<string>();
  const curRequired = [...required];

  for (let i = 0; i < n; i++) {
    if (curRequired[i] === 0) {
      continue;
    }
    const candidatesSorted = [...candidates[i]].sort((a, b) => a - b);
    for (const opp of candidatesSorted) {
      if (curRequired[i] === 0) {
        break;
      }
      if (curRequired[opp] === 0) {
        continue;
      }
      const a = Math.min(i, opp);
      const b = Math.max(i, opp);
      const key = `${a},${b}`;
      if (!matchSet.has(key)) {
        matchSet.add(key);
        curRequired[i]--;
        curRequired[opp]--;
      }
    }
  }

  if (!curRequired.every((value) => value === 0)) {
    return null;
  }

  return interMatchesFromSet(allPlayers, matchSet);
}

function generateInterMatchesDifferential(
  groups: Group[],
  kPerGroup: number[],
): RawMatch[] {
  const allPlayers = buildIndexedPlayers(groups);
  const n = allPlayers.length;
  const required = allPlayers.map((player) => kPerGroup[player.groupIdx]);
  if (required.every((value) => value === 0)) {
    return [];
  }

  const candidates: number[][] = [];
  for (let i = 0; i < n; i++) {
    const others: number[] = [];
    for (let j = 0; j < n; j++) {
      if (i !== j && allPlayers[j].groupIdx !== allPlayers[i].groupIdx) {
        others.push(j);
      }
    }
    candidates.push(others);
  }

  for (let attempt = 0; attempt < 800; attempt++) {
    const result = tryRandomInterMatches(allPlayers, required, candidates);
    if (result) {
      return result;
    }
  }

  const deterministic = tryDeterministicInterMatches(
    allPlayers,
    required,
    candidates,
  );
  if (deterministic) {
    return deterministic;
  }

  throw new FixtureGenerationError("Failed to generate inter-group matches");
}

function generateAllMatches(groups: Group[], kPerGroup: number[]): RawMatch[] {
  const intraMatches: RawMatch[] = [];
  for (const group of groups) {
    const plist = group.players;
    for (let i = 0; i < plist.length; i++) {
      for (let j = i + 1; j < plist.length; j++) {
        intraMatches.push({
          p1: plist[i],
          p2: plist[j],
          typeLabel: `${group.name}-${group.name}`,
        });
      }
    }
  }

  const interMatches = generateInterMatchesDifferential(groups, kPerGroup);
  return [...intraMatches, ...interMatches];
}

function groupsToRecord(groups: Group[]): Record<string, string[]> {
  const record: Record<string, string[]> = {};
  for (const group of groups) {
    record[group.name] = group.players;
  }
  return record;
}

function toFixtureResult(
  groups: Record<string, string[]>,
  rawMatches: RawMatch[],
  matchesPerPlayer: number,
): FixtureGenerationResult {
  return {
    total_matches: rawMatches.length,
    matches_per_player: matchesPerPlayer,
    groups,
    matches: rawMatches.map((match, index) => ({
      slno: index + 1,
      player1: match.p1,
      player2: match.p2,
    })),
  };
}

function verifyEqualMatches(
  matches: RawMatch[],
  players: string[],
): number | null {
  const counts = new Map<string, number>();
  for (const player of players) {
    counts.set(player, 0);
  }
  for (const match of matches) {
    counts.set(match.p1, (counts.get(match.p1) ?? 0) + 1);
    counts.set(match.p2, (counts.get(match.p2) ?? 0) + 1);
  }

  const values = [...counts.values()];
  if (values.length === 0) {
    return null;
  }
  const first = values[0];
  if (values.every((value) => value === first)) {
    return first;
  }
  return null;
}

function generateIntraGroupMatches(players: string[], groupName: string): RawMatch[] {
  const matches: RawMatch[] = [];
  for (let i = 0; i < players.length; i++) {
    for (let j = i + 1; j < players.length; j++) {
      matches.push({
        p1: players[i],
        p2: players[j],
        typeLabel: `${groupName}-${groupName}`,
      });
    }
  }
  return matches;
}

export function scheduleTournament(
  targetTotal: number,
  players: string[],
): FixtureGenerationResult {
  const n = players.length;
  if (n < 2) {
    throw new FixtureGenerationError("At least 2 players required");
  }
  if (targetTotal < 1) {
    throw new FixtureGenerationError("approx_total_matches must be greater than 0");
  }

  const maxShuffleAttempts = 20;

  for (let shuffleAttempt = 0; shuffleAttempt < maxShuffleAttempts; shuffleAttempt++) {
    const shuffled = shufflePlayers(players);
    const candidates: Array<{
      groups: Group[];
      bestT: number;
      kPerGroup: number[];
      totalMatches: number;
      diff: number;
    }> = [];

    for (const g of [2, 3, 4]) {
      if (g > n) {
        continue;
      }

      try {
        const groups = buildGroups(shuffled, g);
        const intraTotal = computeIntraTotal(groups);
        if (targetTotal < intraTotal) {
          continue;
        }

        const { bestT, kPerGroup, totalMatches } = findBestTAndKs(
          groups,
          targetTotal,
        );
        candidates.push({
          groups,
          bestT,
          kPerGroup,
          totalMatches,
          diff: Math.abs(totalMatches - targetTotal),
        });
      } catch (err) {
        if (err instanceof FixtureGenerationError) {
          continue;
        }
        throw err;
      }
    }

    candidates.sort((a, b) => a.diff - b.diff);

    for (const candidate of candidates) {
      try {
        const matches = generateAllMatches(
          candidate.groups,
          candidate.kPerGroup,
        );
        const verified = verifyEqualMatches(matches, shuffled);
        if (verified !== null && verified === candidate.bestT) {
          return toFixtureResult(
            groupsToRecord(candidate.groups),
            matches,
            verified,
          );
        }
      } catch (err) {
        if (!(err instanceof FixtureGenerationError)) {
          throw err;
        }
      }
    }
  }

  throw new FixtureGenerationError(
    "No feasible fixture plan found. Try a different target or player count.",
  );
}

export function generateSuperLeagueFixtures(
  players: string[],
): FixtureGenerationResult {
  if (players.length !== 8) {
    throw new FixtureGenerationError(
      "Superleague requires exactly 8 players in rank order",
    );
  }

  const groupA = [players[0], players[2], players[4], players[6]];
  const groupB = [players[1], players[3], players[5], players[7]];
  const rawMatches = [
    ...generateIntraGroupMatches(groupA, "A"),
    ...generateIntraGroupMatches(groupB, "B"),
  ];

  return toFixtureResult({ A: groupA, B: groupB }, rawMatches, 3);
}

export function generatePlayoffFixtures(
  players: string[],
): FixtureGenerationResult {
  if (players.length === 4) {
    const [a1, a2, b1, b2] = players;
    const rawMatches: RawMatch[] = [
      { p1: a1, p2: b2, typeLabel: "A-B" },
      { p1: b1, p2: a2, typeLabel: "B-A" },
    ];
    return toFixtureResult({ A: [a1, a2], B: [b1, b2] }, rawMatches, 1);
  }

  if (players.length === 2) {
    const rawMatches: RawMatch[] = [
      { p1: players[0], p2: players[1], typeLabel: "F-F" },
    ];
    return toFixtureResult({}, rawMatches, 1);
  }

  throw new FixtureGenerationError(
    "Playoff requires exactly 4 players (SF) or 2 players (Final)",
  );
}

export function generateFixtures(
  stageType: StageType,
  players: string[],
  approxTotalMatches?: number,
): FixtureGenerationResult {
  switch (stageType) {
    case "league":
      if (approxTotalMatches === undefined) {
        throw new FixtureGenerationError(
          "approx_total_matches is required for league stages",
        );
      }
      return scheduleTournament(approxTotalMatches, players);
    case "superleague":
      return generateSuperLeagueFixtures(players);
    case "playoff":
      return generatePlayoffFixtures(players);
    default:
      throw new FixtureGenerationError(`Unsupported stage type: ${stageType}`);
  }
}