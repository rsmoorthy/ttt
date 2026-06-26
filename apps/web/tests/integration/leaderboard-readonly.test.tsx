import { screen } from "@testing-library/react";
import { mockGuest } from "../mocks/data";
import { renderApp } from "../test-utils";

describe("Leaderboard read-only view", () => {
  it("shows the leaderboard table for guests", async () => {
    renderApp({
      route: "/tournaments/summer-open-2026/leaderboard/league",
      user: mockGuest,
      seedFixtures: [{ scored: true }],
    });

    expect(
      await screen.findByRole("heading", { name: "Summer Open 2026" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Rank" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Set W/L ratio" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Refresh" })).toBeInTheDocument();
    expect(screen.queryByRole("textbox")).toBeNull();
    expect(screen.queryByRole("checkbox")).toBeNull();
  });

  it("shows players with zero wins when fixtures exist but have no scores", async () => {
    renderApp({
      route: "/tournaments/summer-open-2026/leaderboard/league",
      user: mockGuest,
      withLeagueFixtures: true,
    });

    const table = await screen.findByRole("table");
    expect(table).toBeInTheDocument();
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
    expect(screen.getAllByText("0").length).toBeGreaterThanOrEqual(2);
  });

  it("shows an empty state when there are no fixtures", async () => {
    renderApp({
      route: "/tournaments/summer-open-2026/leaderboard/league",
      user: mockGuest,
    });

    expect(
      await screen.findByText("No leaderboard entries yet."),
    ).toBeInTheDocument();
  });
});