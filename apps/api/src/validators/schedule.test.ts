import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createScheduleSchema } from "./schedule";

describe("createScheduleSchema", () => {
  it("accepts valid scheduling parameters", () => {
    const parsed = createScheduleSchema.parse({
      numSlots: 7,
      numTables: 2,
      maxMatchesPerSlot: 6,
    });

    assert.equal(parsed.numSlots, 7);
    assert.equal(parsed.numTables, 2);
    assert.equal(parsed.maxMatchesPerSlot, 6);
  });

  it("rejects non-positive numSlots", () => {
    assert.throws(() =>
      createScheduleSchema.parse({
        numSlots: 0,
        numTables: 2,
        maxMatchesPerSlot: 6,
      }),
    );
  });

  it("rejects missing fields", () => {
    assert.throws(() =>
      createScheduleSchema.parse({
        numSlots: 7,
        numTables: 2,
      }),
    );
  });
});