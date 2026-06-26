import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { computeLeaderboard, type LeaderboardMatch } from "./leaderboard";

function match(
  player1: string,
  player2: string,
  scores: Partial<
    Pick<LeaderboardMatch, "game1" | "game2" | "game3" | "game4" | "game5" | "walkover_win">
  > = {},
): LeaderboardMatch {
  return {
    player1,
    player2,
    game1: scores.game1 ?? "",
    game2: scores.game2 ?? "",
    game3: scores.game3 ?? "",
    game4: scores.game4 ?? "",
    game5: scores.game5 ?? "",
    walkover_win: scores.walkover_win ?? "",
  };
}

describe("computeLeaderboard", () => {
  it("ranks players by wins descending", () => {
    const entries = computeLeaderboard([
      match("Alice", "Bob", { game1: "11-7", game2: "11-5" }),
      match("Carol", "Dave", { walkover_win: "Carol" }),
    ]);

    assert.deepEqual(
      entries.map((entry) => [entry.player_name, entry.wins]),
      [
        ["Alice", 1],
        ["Carol", 1],
        ["Bob", 0],
        ["Dave", 0],
      ],
    );
  });

  it("breaks ties on wins using NRR descending for three players", () => {
    const entries = computeLeaderboard([
      match("Tight", "Opp1", {
        game1: "11-9",
        game2: "9-11",
        game3: "11-9",
        game4: "8-11",
        game5: "11-9",
      }),
      match("Medium", "Opp2", {
        game1: "11-8",
        game2: "11-9",
        game3: "11-7",
      }),
      match("Dominant", "Opp3", {
        game1: "11-2",
        game2: "11-3",
        game3: "11-4",
      }),
      match("Opp1", "Opp2", { game1: "11-5", game2: "11-6" }),
      match("Opp2", "Opp3", { game1: "11-6", game2: "11-7" }),
      match("Opp1", "Opp3", { game1: "11-4", game2: "11-5" }),
    ]);

    const leaders = ["Dominant", "Medium", "Tight"].map((name) => {
      const entry = entries.find((item) => item.player_name === name);
      assert.ok(entry);
      assert.equal(entry.wins, 1);
      return entry;
    });

    assert.deepEqual(
      leaders.map((entry) => entry.player_name),
      ["Dominant", "Medium", "Tight"],
    );
    assert.ok(leaders[0]!.nrr > leaders[1]!.nrr);
    assert.ok(leaders[1]!.nrr > leaders[2]!.nrr);
  });

  it("breaks ties on wins using NRR for two players with equal wins", () => {
    const entries = computeLeaderboard([
      match("Strong", "Weak1", { game1: "11-3", game2: "11-4", game3: "11-2" }),
      match("Narrow", "Weak2", {
        game1: "11-9",
        game2: "9-11",
        game3: "11-9",
        game4: "9-11",
        game5: "11-8",
      }),
      match("Weak1", "Weak2", { game1: "7-11", game2: "6-11" }),
    ]);

    const strong = entries.find((entry) => entry.player_name === "Strong");
    const narrow = entries.find((entry) => entry.player_name === "Narrow");

    assert.ok(strong);
    assert.ok(narrow);
    assert.equal(strong.wins, 1);
    assert.equal(narrow.wins, 1);
    assert.ok(strong.nrr > narrow.nrr);
    assert.ok(strong.rank < narrow.rank);
  });

  it("reverses scores for player2 when computing relative results", () => {
    const entries = computeLeaderboard([
      match("Alice", "Bob", { game1: "11-7", game2: "11-5" }),
    ]);

    const alice = entries.find((entry) => entry.player_name === "Alice");
    const bob = entries.find((entry) => entry.player_name === "Bob");

    assert.equal(alice?.wins, 1);
    assert.equal(bob?.wins, 0);
    assert.equal(alice?.swlr, 99);
    assert.equal(bob?.swlr, 0);
  });

  it("includes more than ten players from fixtures", () => {
    const players = Array.from({ length: 12 }, (_, index) => `P${index + 1}`);
    const matches: LeaderboardMatch[] = [];

    for (let i = 0; i < players.length; i += 2) {
      matches.push(
        match(players[i]!, players[i + 1]!, {
          game1: "11-7",
          game2: "11-5",
        }),
      );
    }

    const entries = computeLeaderboard(matches);
    assert.equal(entries.length, 12);
    assert.equal(entries.filter((entry) => entry.wins === 1).length, 6);
    assert.equal(entries.filter((entry) => entry.wins === 0).length, 6);
  });

  it("ignores matches without scores or walkover", () => {
    const entries = computeLeaderboard([
      match("Alice", "Bob"),
      match("Carol", "Dave", { game1: "11-9", game2: "11-7" }),
    ]);

    assert.equal(entries.find((entry) => entry.player_name === "Alice")?.wins, 0);
    assert.equal(entries.find((entry) => entry.player_name === "Carol")?.wins, 1);
  });

  it("assigns sequential ranks", () => {
    const entries = computeLeaderboard([
      match("A", "B", { game1: "11-7", game2: "11-5", game3: "11-3" }),
      match("C", "D", { game1: "11-9", game2: "9-11", game3: "11-8" }),
      match("E", "F", { walkover_win: "E" }),
    ]);

    assert.deepEqual(
      entries.map((entry) => entry.rank),
      [1, 2, 3, 4, 5, 6],
    );
  });
});