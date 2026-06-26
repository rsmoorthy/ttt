import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { mockGuest } from "../mocks/data";
import { renderApp } from "../test-utils";

describe("Leaderboard tournament picker", () => {
  it("opens the leaderboard screen for a tournament", async () => {
    const user = userEvent.setup();

    renderApp({
      route: "/leaderboard",
      user: mockGuest,
      seedFixtures: [{ scored: true }],
    });

    expect(
      await screen.findByRole("heading", {
        name: "Leaderboard — Select tournament",
      }),
    ).toBeInTheDocument();

    expect(await screen.findByText("Summer Open 2026")).toBeInTheDocument();
    const openLinks = await screen.findAllByRole("link", { name: "Open" });
    await user.click(openLinks[0]);

    expect(
      await screen.findByRole("columnheader", { name: "Rank" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Alice")).toBeInTheDocument();
  });
});