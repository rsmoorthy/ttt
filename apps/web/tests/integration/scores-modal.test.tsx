import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { mockScorer } from "../mocks/data";
import { renderApp } from "../test-utils";

describe("Score edit modal", () => {
  it("opens a popup when a row is clicked", async () => {
    const user = userEvent.setup();

    renderApp({
      route: "/tournaments/summer-open-2026/scores/league",
      user: mockScorer,
      withLeagueFixtures: true,
    });

    await screen.findByLabelText("game1 for match 1");
    await user.click(screen.getByRole("cell", { name: "1" }));

    expect(
      await screen.findByRole("dialog", { name: /match 1/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Game 1")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Close" }).length).toBeGreaterThan(
      0,
    );
  });
});