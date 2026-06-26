import { describe, expect, it } from "vitest";
import {
  hasMinimumRole,
  navItemsForRole,
} from "../../../src/constants/navigation";

describe("navigation helpers", () => {
  it("checks role hierarchy", () => {
    expect(hasMinimumRole("superadmin", "admin")).toBe(true);
    expect(hasMinimumRole("guest", "admin")).toBe(false);
  });

  it("filters nav items by role", () => {
    const guestItems = navItemsForRole("guest");
    expect(guestItems.some((item) => item.label === "Tournaments")).toBe(
      false,
    );
    expect(guestItems.some((item) => item.label === "Scores")).toBe(true);
    expect(guestItems.some((item) => item.label === "Schedule")).toBe(true);
    expect(guestItems.some((item) => item.label === "Leaderboard")).toBe(true);
    expect(guestItems.some((item) => item.label === "Move to Stage")).toBe(
      false,
    );

    const adminItems = navItemsForRole("admin");
    expect(adminItems.some((item) => item.label === "Move to Stage")).toBe(
      true,
    );

    const superItems = navItemsForRole("superadmin");
    expect(superItems.some((item) => item.label === "Tournaments")).toBe(true);
  });
});