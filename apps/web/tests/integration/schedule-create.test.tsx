import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { mockAdmin } from "../mocks/data";
import { renderApp } from "../test-utils";

describe("Create schedule", () => {
  it("schedules matches for a league stage", async () => {
    const user = userEvent.setup();

    renderApp({
      route: "/tournaments/summer-open-2026/schedule/league",
      user: mockAdmin,
      withLeagueFixtures: true,
    });

    await screen.findByText("1. Alice vs Bob");
    await user.click(screen.getByRole("button", { name: "Schedule" }));

    expect(await screen.findByText("1. Alice vs Bob")).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Matches in Table 1" })).toBeInTheDocument();
    expect(screen.getByLabelText(/hour slots/i)).toBeInTheDocument();
  });
});