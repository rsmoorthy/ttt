import {
  FIXTURE_REGENERATE_CONFIRM,
  showApproxTotalMatches,
} from "../../../src/utils/fixtures";

describe("fixtures utils", () => {
  it("shows approx total matches only for league stages", () => {
    expect(showApproxTotalMatches("league")).toBe(true);
    expect(showApproxTotalMatches("superleague")).toBe(false);
    expect(showApproxTotalMatches("playoff")).toBe(false);
  });

  it("defines the regenerate confirmation copy", () => {
    expect(FIXTURE_REGENERATE_CONFIRM).toContain("dangerous");
  });
});