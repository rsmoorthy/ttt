import { screen, waitFor } from "@testing-library/react";
import { mockGuest } from "../mocks/data";
import { renderApp } from "../test-utils";

describe("Leaderboard stage redirect", () => {
  it("redirects to the first stage when no stage is selected", async () => {
    renderApp({
      route: "/tournaments/summer-open-2026/leaderboard",
      user: mockGuest,
      seedFixtures: [{ scored: true }],
    });

    await waitFor(() => {
      expect(screen.getByRole("link", { name: "League" })).toHaveAttribute(
        "aria-current",
        "page",
      );
    });

    expect(screen.getByText("Alice")).toBeInTheDocument();
  });
});