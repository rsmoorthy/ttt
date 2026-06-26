import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { mockScorer } from "../mocks/data";
import { renderApp } from "../test-utils";

describe("Edit scores", () => {
  it("saves a game score from the table", async () => {
    const user = userEvent.setup();

    renderApp({
      route: "/tournaments/summer-open-2026/scores/league",
      user: mockScorer,
      withLeagueFixtures: true,
    });

    const gameInput = await screen.findByLabelText("game1 for match 1");
    await user.clear(gameInput);
    await user.type(gameInput, "11-7");
    await user.tab();

    await waitFor(() => {
      expect(screen.getByDisplayValue("11-7")).toBeInTheDocument();
      expect(screen.getByText("Saved")).toBeInTheDocument();
    });
  });
});