import { screen } from "@testing-library/react";
import { mockAdmin } from "../mocks/data";
import { renderApp } from "../test-utils";

describe("Superleague schedule screen", () => {
  it("hides scheduling controls for non-league stages", async () => {
    renderApp({
      route: "/tournaments/summer-open-2026/schedule/qf",
      user: mockAdmin,
      seedFixtures: [{ tournamentSlug: "summer-open-2026", stageSlug: "qf" }],
    });

    await screen.findByRole("link", { name: "Quarter Finals" });
    expect(screen.queryByLabelText(/hour slots/i)).toBeNull();
    expect(screen.queryByRole("button", { name: "Schedule" })).toBeNull();
    expect(screen.getByText(/league stages only/i)).toBeInTheDocument();
  });
});