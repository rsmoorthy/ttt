import { screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mockGuest } from "../mocks/data";
import { renderApp } from "../test-utils";

describe("Leaderboard auto-refresh", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("refetches leaderboard every five minutes without showing loading", async () => {
    renderApp({
      route: "/tournaments/summer-open-2026/leaderboard/league",
      user: mockGuest,
      seedFixtures: [{ scored: true }],
    });

    expect(
      await screen.findByRole("columnheader", { name: "Rank" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("Loading leaderboard…")).toBeNull();

    vi.advanceTimersByTime(5 * 60 * 1000);

    await waitFor(() => {
      expect(screen.getByText("Alice")).toBeInTheDocument();
      expect(screen.queryByText("Loading leaderboard…")).toBeNull();
    });
  });
});