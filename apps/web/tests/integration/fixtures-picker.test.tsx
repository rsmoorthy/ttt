import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { mockAdmin } from "../mocks/data";
import { renderApp } from "../test-utils";

describe("Fixtures tournament picker", () => {
  it("opens the fixtures screen for a tournament", async () => {
    const user = userEvent.setup();

    renderApp({ route: "/fixtures", user: mockAdmin });

    expect(
      await screen.findByRole("heading", { name: "Fixtures — Select tournament" }),
    ).toBeInTheDocument();

    expect(await screen.findByText("Summer Open 2026")).toBeInTheDocument();
    const openLinks = await screen.findAllByRole("link", { name: "Open" });
    await user.click(openLinks[0]);

    expect(await screen.findByText("Alice")).toBeInTheDocument();
    expect(screen.getByLabelText(/approx total matches/i)).toBeInTheDocument();
  });
});