import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { mockAdmin } from "../mocks/data";
import { renderApp } from "../test-utils";

describe("Move players tournament picker", () => {
  it("opens the move players screen for a tournament", async () => {
    const user = userEvent.setup();

    renderApp({
      route: "/move-players",
      user: mockAdmin,
      seedFixtures: [{ scored: true }],
    });

    expect(
      await screen.findByRole("heading", {
        name: "Move to Stage — Select tournament",
      }),
    ).toBeInTheDocument();

    const openLinks = await screen.findAllByRole("link", { name: "Open" });
    await user.click(openLinks[0]);

    expect(
      await screen.findByRole("columnheader", { name: "Select" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Target stage")).toBeInTheDocument();
  });
});