import { screen, within } from "@testing-library/react";
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
  });
});