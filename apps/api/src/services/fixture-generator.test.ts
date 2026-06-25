import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  FixtureGenerationError,
  generateFixtures,
  generatePlayoffFixtures,
  generateSuperLeagueFixtures,
  scheduleTournament,
} from "./fixture-generator";

function playerCounts(matches: Array<{ player1: string; player2: string }>) {
  const counts = new Map<string, number>();
  for (const match of matches) {
    counts.set(match.player1, (counts.get(match.player1) ?? 0) + 1);
    counts.set(match.player2, (counts.get(match.player2) ?? 0) + 1);
  }
  return counts;
}

function allPlayersHaveEqualMatches(
  matches: Array<{ player1: string; player2: string }>,
  players: string[],
): boolean {
  const counts = playerCounts(matches);
  const values = players.map((player) => counts.get(player) ?? 0);
  return values.every((value) => value === values[0]);
}

describe("scheduleTournament (league)", () => {
  it("generates fixtures for 4 players", () => {
    const result = scheduleTournament(6, ["A", "B", "C", "D"]);
    assert.equal(result.total_matches, 6);
    assert.equal(result.matches_per_player, 3);
    assert.equal(result.matches.length, 6);
    assert.ok(allPlayersHaveEqualMatches(result.matches, ["A", "B", "C", "D"]));
  });

  it("generates fixtures near target for 17 players", () => {
    const players = Array.from({ length: 17 }, (_, i) => `P${i + 1}`);
    const result = scheduleTournament(70, players);
    assert.ok(result.matches_per_player >= 7);
    assert.ok(Math.abs(result.total_matches - 70) <= 6);
    assert.equal(
      result.total_matches,
      (result.matches_per_player * players.length) / 2,
    );
    assert.ok(allPlayersHaveEqualMatches(result.matches, players));
  });

  it("rejects fewer than 2 players", () => {
    assert.throws(
      () => scheduleTournament(10, ["solo"]),
      (err: unknown) =>
        err instanceof FixtureGenerationError &&
        err.message === "At least 2 players required",
    );
  });

  it("rejects impossible target", () => {
    assert.throws(
      () => scheduleTournament(0, ["A", "B", "C", "D"]),
      (err: unknown) =>
        err instanceof FixtureGenerationError &&
        err.message === "approx_total_matches must be greater than 0",
    );
  });
});

describe("generateSuperLeagueFixtures", () => {
  it("splits top 8 into ranked groups and creates 12 matches", () => {
    const players = ["P1", "P2", "P3", "P4", "P5", "P6", "P7", "P8"];
    const result = generateSuperLeagueFixtures(players);

    assert.deepEqual(result.groups.A, ["P1", "P3", "P5", "P7"]);
    assert.deepEqual(result.groups.B, ["P2", "P4", "P6", "P8"]);
    assert.equal(result.total_matches, 12);
    assert.equal(result.matches_per_player, 3);

    for (const match of result.matches) {
      const sameGroup =
        (result.groups.A.includes(match.player1) &&
          result.groups.A.includes(match.player2)) ||
        (result.groups.B.includes(match.player1) &&
          result.groups.B.includes(match.player2));
      assert.ok(sameGroup, "superleague matches must stay within a group");
    }
  });

  it("rejects wrong player count", () => {
    assert.throws(
      () => generateSuperLeagueFixtures(["A", "B", "C"]),
      (err: unknown) =>
        err instanceof FixtureGenerationError &&
        err.message === "Superleague requires exactly 8 players in rank order",
    );
  });
});

describe("generatePlayoffFixtures", () => {
  it("creates semifinal cross pairings", () => {
    const result = generatePlayoffFixtures(["A1", "A2", "B1", "B2"]);
    assert.deepEqual(result.groups.A, ["A1", "A2"]);
    assert.deepEqual(result.groups.B, ["B1", "B2"]);
    assert.equal(result.total_matches, 2);
    assert.deepEqual(result.matches, [
      { slno: 1, player1: "A1", player2: "B2" },
      { slno: 2, player1: "B1", player2: "A2" },
    ]);
  });

  it("creates a single final match", () => {
    const result = generatePlayoffFixtures(["F1", "F2"]);
    assert.equal(result.total_matches, 1);
    assert.deepEqual(result.matches, [
      { slno: 1, player1: "F1", player2: "F2" },
    ]);
    assert.deepEqual(result.groups, {});
  });

  it("rejects invalid player count", () => {
    assert.throws(
      () => generatePlayoffFixtures(["A", "B", "C"]),
      (err: unknown) =>
        err instanceof FixtureGenerationError &&
        err.message ===
          "Playoff requires exactly 4 players (SF) or 2 players (Final)",
    );
  });
});

describe("generateFixtures dispatcher", () => {
  it("requires approx_total_matches for league", () => {
    assert.throws(
      () => generateFixtures("league", ["A", "B", "C", "D"]),
      (err: unknown) =>
        err instanceof FixtureGenerationError &&
        err.message === "approx_total_matches is required for league stages",
    );
  });

  it("dispatches superleague without approx_total_matches", () => {
    const players = ["P1", "P2", "P3", "P4", "P5", "P6", "P7", "P8"];
    const result = generateFixtures("superleague", players);
    assert.equal(result.total_matches, 12);
  });

  it("dispatches playoff without approx_total_matches", () => {
    const result = generateFixtures("playoff", ["A1", "A2", "B1", "B2"]);
    assert.equal(result.total_matches, 2);
  });
});