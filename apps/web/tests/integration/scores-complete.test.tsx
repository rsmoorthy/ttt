import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { mockScorer } from "../mocks/data";
import { renderApp } from "../test-utils";

async function enterValidScores(
  user: ReturnType<typeof userEvent.setup>,
  games: Array<{ label: string; value: string }>,
) {
  for (const game of games) {
    const input = screen.getByLabelText(game.label);
    await user.clear(input);
    await user.type(input, game.value);
    await user.tab();
    await waitFor(() => {
      expect(screen.getByDisplayValue(game.value)).toBeInTheDocument();
    });
  }
}

describe("Complete match", () => {
  it("keeps match over disabled until game1 and game2 are valid", async () => {
    const user = userEvent.setup();

    renderApp({
      route: "/tournaments/summer-open-2026/scores/league",
      user: mockScorer,
      withLeagueFixtures: true,
    });

    const game1 = await screen.findByLabelText("game1 for match 1");
    await user.clear(game1);
    await user.type(game1, "11-7");
    await user.tab();

    await waitFor(() => {
      expect(screen.getByDisplayValue("11-7")).toBeInTheDocument();
    });

    expect(screen.getByRole("button", { name: "Match Over" })).toBeDisabled();
  });

  it("keeps match over disabled when each player has won one game", async () => {
    const user = userEvent.setup();

    renderApp({
      route: "/tournaments/summer-open-2026/scores/league",
      user: mockScorer,
      withLeagueFixtures: true,
    });

    await screen.findByLabelText("game1 for match 1");
    await enterValidScores(user, [
      { label: "game1 for match 1", value: "11-7" },
      { label: "game2 for match 1", value: "9-11" },
    ]);

    expect(screen.getByRole("button", { name: "Match Over" })).toBeDisabled();
  });

  it("marks a match as completed when game1 and game2 give a decisive result", async () => {
    const user = userEvent.setup();

    renderApp({
      route: "/tournaments/summer-open-2026/scores/league",
      user: mockScorer,
      withLeagueFixtures: true,
    });

    await screen.findByLabelText("game1 for match 1");
    await enterValidScores(user, [
      { label: "game1 for match 1", value: "11-7" },
      { label: "game2 for match 1", value: "11-5" },
    ]);

    await user.click(screen.getByRole("button", { name: "Match Over" }));

    expect(
      await screen.findByRole("button", { name: "Completed" }),
    ).toBeDisabled();
  });

  it("marks a match as completed when walkover is selected", async () => {
    const user = userEvent.setup();

    renderApp({
      route: "/tournaments/summer-open-2026/scores/league",
      user: mockScorer,
      withLeagueFixtures: true,
    });

    await screen.findByLabelText("game1 for match 1");
    await user.selectOptions(
      screen.getByLabelText("Walkover win for match 1"),
      "Alice",
    );

    await user.click(screen.getByRole("button", { name: "Match Over" }));

    expect(
      await screen.findByRole("button", { name: "Completed" }),
    ).toBeDisabled();
  });
});