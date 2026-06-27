import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { mockGuest } from "../mocks/data";
import { renderApp } from "../test-utils";

describe("Scores filters", () => {
  it("populates filter dropdowns from match data", async () => {
    renderApp({
      route: "/tournaments/summer-open-2026/scores/league",
      user: mockGuest,
      seedFixtures: [{ scheduled: true }],
    });

    const playerSelect = await screen.findByLabelText("Player");
    expect(
      within(playerSelect).getByRole("option", { name: "Alice" }),
    ).toBeInTheDocument();
    expect(
      within(playerSelect).getByRole("option", { name: "Bob" }),
    ).toBeInTheDocument();
    expect(
      within(screen.getByLabelText("Hour slot")).getByRole("option", {
        name: "1",
      }),
    ).toBeInTheDocument();
    expect(
      within(screen.getByLabelText("Match status")).getByRole("option", {
        name: "Pending matches",
      }),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText("Table")).toBeNull();
  });

  it("filters matches by completion status", async () => {
    const user = userEvent.setup();

    renderApp({
      route: "/tournaments/summer-open-2026/scores/league",
      user: mockGuest,
      seedFixtures: [{ scheduled: true, scored: true }],
    });

    expect(
      await screen.findByLabelText("game1 for match 1"),
    ).toBeInTheDocument();

    await user.selectOptions(
      screen.getByLabelText("Match status"),
      "Pending matches",
    );

    expect(screen.queryByLabelText("game1 for match 1")).toBeNull();
    expect(screen.getByText("No matches to display.")).toBeInTheDocument();

    await user.selectOptions(
      screen.getByLabelText("Match status"),
      "Completed matches",
    );

    expect(screen.getByLabelText("game1 for match 1")).toBeInTheDocument();
  });
});