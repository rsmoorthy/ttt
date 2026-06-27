import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { listMatchesQuerySchema, patchMatchSchema } from "./scores";

describe("patchMatchSchema", () => {
  it("accepts partial score updates", () => {
    const parsed = patchMatchSchema.parse({ game1: "11-7" });
    assert.equal(parsed.game1, "11-7");
  });

  it("rejects empty update body", () => {
    assert.throws(() => patchMatchSchema.parse({}));
  });
});

describe("listMatchesQuerySchema", () => {
  it("parses match list query parameters", () => {
    const parsed = listMatchesQuerySchema.parse({
      player: "Alice",
      hour_slot: "2",
      completion: "pending",
    });
    assert.equal(parsed.player, "Alice");
    assert.equal(parsed.hour_slot, 2);
    assert.equal(parsed.completion, "pending");
  });
});