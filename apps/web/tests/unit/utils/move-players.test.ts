import { describe, expect, it } from "vitest";
import {
  buildMoveConfirmMessage,
  buildMoveSuccessMessage,
  canSubmitMove,
  stageLabel,
  targetStageOptions,
} from "../../../src/utils/move-players";

const stages = [
  {
    slug: "league",
    name: "League",
    description: "",
    stage_type: "league" as const,
    is_completed: false,
  },
  {
    slug: "qf",
    name: "Quarter Finals",
    description: "",
    stage_type: "superleague" as const,
    is_completed: false,
  },
];

describe("move-players utils", () => {
  it("filters target stage options to exclude the current stage", () => {
    expect(targetStageOptions(stages, "league")).toEqual([stages[1]]);
    expect(targetStageOptions(stages, "qf")).toEqual([stages[0]]);
  });

  it("builds confirm and success messages", () => {
    expect(buildMoveConfirmMessage(2, "Quarter Finals")).toBe(
      "Move 2 player(s) to Quarter Finals? This replaces the player list for that stage.",
    );
    expect(buildMoveSuccessMessage(2, "Quarter Finals")).toBe(
      "Moved 2 player(s) to Quarter Finals successfully.",
    );
  });

  it("checks whether a move can be submitted", () => {
    expect(canSubmitMove("qf", 1)).toBe(true);
    expect(canSubmitMove("", 1)).toBe(false);
    expect(canSubmitMove("qf", 0)).toBe(false);
  });

  it("resolves stage labels from slug", () => {
    expect(stageLabel(stages, "qf")).toBe("Quarter Finals");
    expect(stageLabel(stages, "missing")).toBe("missing");
  });
});