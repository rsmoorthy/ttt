import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { mockGuest } from "../mocks/data";
import { renderApp } from "../test-utils";

describe("Leaderboard refresh", () => {
  it("reloads leaderboard data when Refresh is clicked", async () => {
    const user = userEvent.setup();

    renderApp({
      route: "/tournaments/summer-open-2026/leaderboard/league",
      user: mockGuest,
      seedFixtures: [{ scored: true }],
    });

    expect(
      await screen.findByRole("columnheader", { name: "Rank" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Alice")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Refresh" }));

    await waitFor(() => {
      expect(screen.getByText("Alice")).toBeInTheDocument();
      expect(screen.getByText("Bob")).toBeInTheDocument();
      expect(screen.queryByText("Loading leaderboard…")).toBeNull();
    });
  });
});