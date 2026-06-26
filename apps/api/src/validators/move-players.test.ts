import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { movePlayersSchema } from "./move-players";

describe("movePlayersSchema", () => {
  it("accepts a valid move-players payload", () => {
    const parsed = movePlayersSchema.parse({
      target_stage: "qf",
      players: ["Alice", "Bob"],
    });

    assert.deepEqual(parsed.players, ["Alice", "Bob"]);
    assert.equal(parsed.target_stage, "qf");
  });

  it("rejects empty players list", () => {
    assert.throws(() =>
      movePlayersSchema.parse({
        target_stage: "qf",
        players: [],
      }),
    );
  });

  it("rejects missing target_stage", () => {
    assert.throws(() =>
      movePlayersSchema.parse({
        players: ["Alice"],
      }),
    );
  });
});