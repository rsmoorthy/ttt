import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { mockAdmin } from "../mocks/data";
import { renderApp } from "../test-utils";

describe("Schedule tournament picker", () => {
  it("opens the schedule screen for a tournament", async () => {
    const user = userEvent.setup();

    renderApp({ route: "/schedule", user: mockAdmin, withLeagueFixtures: true });

    expect(
      await screen.findByRole("heading", { name: "Schedule — Select tournament" }),
    ).toBeInTheDocument();

    expect(await screen.findByText("Summer Open 2026")).toBeInTheDocument();
    const openLinks = await screen.findAllByRole("link", { name: "Open" });
    await user.click(openLinks[0]);

    expect(await screen.findByText("1. Alice vs Bob")).toBeInTheDocument();
    expect(screen.getByLabelText(/hour slots/i)).toBeInTheDocument();
  });
});