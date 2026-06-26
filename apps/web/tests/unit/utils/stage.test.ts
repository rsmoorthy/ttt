import { formatCompleted, formatStageType } from "../../../src/utils/stage";

describe("stage utils", () => {
  it("formats stage type labels", () => {
    expect(formatStageType("league")).toBe("League");
    expect(formatStageType("superleague")).toBe("Super League");
    expect(formatStageType("playoff")).toBe("Playoff");
  });

  it("formats completed flag", () => {
    expect(formatCompleted(true)).toBe("Yes");
    expect(formatCompleted(false)).toBe("No");
  });
});