import { screen } from "@testing-library/react";
import { mockAdmin, mockGuest } from "../mocks/data";
import { renderApp } from "../test-utils";

describe("Schedule without fixtures", () => {
  it("prompts admins to create fixtures first", async () => {
    renderApp({
      route: "/tournaments/summer-open-2026/schedule/league",
      user: mockAdmin,
    });

    expect(await screen.findByText(/create fixtures first/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Go to Fixtures" })).toHaveAttribute(
      "href",
      "/tournaments/summer-open-2026/fixtures/league",
    );
  });

  it("shows the message without a fixtures link for guests", async () => {
    renderApp({
      route: "/tournaments/summer-open-2026/schedule/league",
      user: mockGuest,
    });

    expect(await screen.findByText(/create fixtures first/i)).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Go to Fixtures" })).toBeNull();
  });
});