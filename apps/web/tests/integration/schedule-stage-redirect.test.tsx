import { screen, waitFor } from "@testing-library/react";
import { mockAdmin } from "../mocks/data";
import { renderApp } from "../test-utils";

describe("Schedule stage redirect", () => {
  it("redirects to the first stage when no stage is selected", async () => {
    renderApp({
      route: "/tournaments/summer-open-2026/schedule",
      user: mockAdmin,
      withLeagueFixtures: true,
    });

    await waitFor(() => {
      expect(screen.getByRole("link", { name: "League" })).toHaveAttribute(
        "aria-current",
        "page",
      );
    });

    expect(screen.getByText("1. Alice vs Bob")).toBeInTheDocument();
  });
});