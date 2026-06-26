import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  hasScoreContent,
  validateMatchScores,
  validateScoreString,
} from "./score-validation";

const emptyState = {
  game1: "",
  game2: "",
  game3: "",
  game4: "",
  game5: "",
  walkover_win: "",
};

describe("validateScoreString", () => {
  it("accepts empty scores", () => {
    assert.equal(validateScoreString("", "game1"), null);
  });

  it("accepts valid 11-7 scores", () => {
    assert.equal(validateScoreString("11-7", "game1"), null);
  });

  it("accepts deuce games with exactly 2 point difference", () => {
    assert.equal(validateScoreString("16-14", "game1"), null);
  });

  it("rejects invalid format", () => {
    assert.match(validateScoreString("11x7", "game1") ?? "", /Invalid score format/);
  });

  it("rejects scores below 11 for both players", () => {
    assert.match(
      validateScoreString("10-8", "game1") ?? "",
      /At least one score must be 11 or greater/,
    );
  });

  it("rejects insufficient lead when both are 11 or less", () => {
    assert.match(
      validateScoreString("11-10", "game1") ?? "",
      /lead by at least 2/,
    );
  });

  it("rejects deuce games without exactly 2 point difference", () => {
    assert.match(
      validateScoreString("15-12", "game1") ?? "",
      /exactly 2/,
    );
  });
});

describe("validateMatchScores", () => {
  it("accepts a valid multi-game result", () => {
    assert.equal(
      validateMatchScores(
        {
          ...emptyState,
          game1: "11-7",
          game2: "9-11",
          game3: "11-8",
        },
        "Alice",
        "Bob",
      ),
      null,
    );
  });

  it("rejects setting game2 before game1", () => {
    const errors = validateMatchScores(
      { ...emptyState, game2: "11-7" },
      "Alice",
      "Bob",
    );
    assert.ok(errors);
    assert.match(errors.game2, /before game1/);
  });

  it("rejects walkover together with game scores", () => {
    const errors = validateMatchScores(
      {
        ...emptyState,
        game1: "11-7",
        walkover_win: "Alice",
      },
      "Alice",
      "Bob",
    );
    assert.ok(errors);
    assert.match(errors.walkover_win, /Walkover cannot be set/);
  });

  it("rejects walkover winner not in the match", () => {
    const errors = validateMatchScores(
      { ...emptyState, walkover_win: "Carol" },
      "Alice",
      "Bob",
    );
    assert.ok(errors);
    assert.match(errors.walkover_win, /player1 or player2/);
  });

  it("accepts walkover for a listed player", () => {
    assert.equal(
      validateMatchScores(
        { ...emptyState, walkover_win: "Bob" },
        "Alice",
        "Bob",
      ),
      null,
    );
  });
});

describe("hasScoreContent", () => {
  it("returns false for empty state", () => {
    assert.equal(hasScoreContent(emptyState), false);
  });

  it("returns true when any game score is present", () => {
    assert.equal(hasScoreContent({ ...emptyState, game1: "11-7" }), true);
  });

  it("returns true when walkover is present", () => {
    assert.equal(
      hasScoreContent({ ...emptyState, walkover_win: "Alice" }),
      true,
    );
  });
});