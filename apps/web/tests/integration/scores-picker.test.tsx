import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { mockGuest } from "../mocks/data";
import { renderApp } from "../test-utils";

describe("Scores tournament picker", () => {
  it("opens the scores screen for a tournament", async () => {
    const user = userEvent.setup();

    renderApp({
      route: "/scores",
      user: mockGuest,
      withLeagueFixtures: true,
    });

    expect(
      await screen.findByRole("heading", { name: "Scores — Select tournament" }),
    ).toBeInTheDocument();

    const openLinks = await screen.findAllByRole("link", { name: "Open" });
    await user.click(openLinks[0]);

    expect(await screen.findByLabelText("Player")).toBeInTheDocument();
    expect(screen.getAllByText("Alice").length).toBeGreaterThan(0);
    expect(screen.getByLabelText("Player")).toBeInTheDocument();
  });
});