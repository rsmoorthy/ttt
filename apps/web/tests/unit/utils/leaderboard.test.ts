import { describe, expect, it } from "vitest";
import { formatNrr, formatRatio } from "../../../src/utils/leaderboard";

describe("leaderboard formatting", () => {
  it("formats NRR to four decimal places", () => {
    expect(formatNrr(2.855)).toBe("2.8550");
    expect(formatNrr(0)).toBe("0.0000");
  });

  it("formats ratios to two decimal places", () => {
    expect(formatRatio(2.5)).toBe("2.50");
    expect(formatRatio(99)).toBe("99.00");
  });
});