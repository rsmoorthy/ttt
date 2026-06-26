import { screen } from "@testing-library/react";
import { mockGuest } from "../mocks/data";
import { renderApp } from "../test-utils";

describe("Scores read-only view", () => {
  it("shows matches without edit controls for guests", async () => {
    renderApp({
      route: "/tournaments/summer-open-2026/scores/league",
      user: mockGuest,
      withLeagueFixtures: true,
    });

    expect(
      await screen.findByRole("heading", { name: "Summer Open 2026" }),
    ).toBeInTheDocument();
    expect(screen.getAllByText("Alice").length).toBeGreaterThan(0);
    expect(screen.getByLabelText("game1 for match 1")).toHaveAttribute(
      "readonly",
    );
    expect(screen.queryByRole("button", { name: "Match Over" })).toBeNull();
  });
});