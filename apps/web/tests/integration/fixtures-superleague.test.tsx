import { screen } from "@testing-library/react";
import { mockAdmin } from "../mocks/data";
import { renderApp } from "../test-utils";

describe("Superleague fixtures screen", () => {
  it("hides approx total matches for non-league stages", async () => {
    renderApp({
      route: "/tournaments/summer-open-2026/fixtures/qf",
      user: mockAdmin,
    });

    await screen.findByRole("link", { name: "Quarter Finals" });
    expect(screen.queryByLabelText(/approx total matches/i)).toBeNull();
    expect(
      screen.getByRole("button", { name: "Create Fixtures" }),
    ).toBeInTheDocument();
  });
});