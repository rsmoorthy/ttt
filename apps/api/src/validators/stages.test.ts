import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createStageSchema, updateStageSchema } from "./stages";

describe("createStageSchema", () => {
  it("accepts all stage_type values", () => {
    for (const stage_type of ["league", "superleague", "playoff"] as const) {
      const parsed = createStageSchema.parse({
        name: "Stage",
        slug: "my-stage",
        stage_type,
      });
      assert.equal(parsed.stage_type, stage_type);
    }
  });

  it("defaults stage_type to league when omitted", () => {
    const parsed = createStageSchema.parse({
      name: "Stage",
      slug: "my-stage",
    });
    assert.equal(parsed.stage_type, "league");
  });

  it("rejects invalid stage_type", () => {
    assert.throws(() =>
      createStageSchema.parse({
        name: "Stage",
        slug: "my-stage",
        stage_type: "knockout",
      }),
    );
  });
});

describe("updateStageSchema", () => {
  it("allows updating stage_type alone", () => {
    const parsed = updateStageSchema.parse({ stage_type: "playoff" });
    assert.equal(parsed.stage_type, "playoff");
  });

  it("rejects empty update", () => {
    assert.throws(() => updateStageSchema.parse({}));
  });
});