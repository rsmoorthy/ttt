import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { mockScorer } from "../mocks/data";
import { renderApp } from "../test-utils";

describe("Scores validation", () => {
  it("shows an alert for invalid scores and refocuses the field", async () => {
    const user = userEvent.setup();

    renderApp({
      route: "/tournaments/summer-open-2026/scores/league",
      user: mockScorer,
      withLeagueFixtures: true,
    });

    const gameInput = await screen.findByLabelText("game1 for match 1");
    await user.clear(gameInput);
    await user.type(gameInput, "5-5");
    await user.tab();

    expect(
      await screen.findByRole("alertdialog", { name: "Invalid score" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Invalid score. Please correct it"),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Ok" }));

    await waitFor(() => {
      expect(gameInput).toHaveFocus();
    });
    expect(gameInput).toHaveAttribute("aria-invalid", "true");
    expect(screen.queryByText("Saved")).toBeNull();

    await user.clear(gameInput);
    await user.type(gameInput, "11-7");
    await user.tab();

    await waitFor(() => {
      expect(screen.getByText("Saved")).toBeInTheDocument();
    });
    expect(gameInput).not.toHaveAttribute("aria-invalid", "true");
  });

  it("shows a specific alert when walkover is set while game scores exist", async () => {
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
      expect(screen.getByText("Saved")).toBeInTheDocument();
    });

    await user.selectOptions(
      screen.getByLabelText("Walkover win for match 1"),
      "Alice",
    );

    expect(
      await screen.findByRole("alertdialog", { name: "Invalid score" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Cannot set Walkover Win, when game scores are present. Empty the scores and set Walkover Win",
      ),
    ).toBeInTheDocument();
  });
});