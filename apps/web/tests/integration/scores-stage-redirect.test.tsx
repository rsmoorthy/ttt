import { screen, waitFor } from "@testing-library/react";
import { mockGuest } from "../mocks/data";
import { renderApp } from "../test-utils";

describe("Scores stage redirect", () => {
  it("redirects to the first stage when no stage is selected", async () => {
    renderApp({
      route: "/tournaments/summer-open-2026/scores",
      user: mockGuest,
      withLeagueFixtures: true,
    });

    await waitFor(() => {
      expect(screen.getByRole("link", { name: "League" })).toHaveAttribute(
        "aria-current",
        "page",
      );
    });

    expect(screen.getAllByText("Alice").length).toBeGreaterThan(0);
  });
});