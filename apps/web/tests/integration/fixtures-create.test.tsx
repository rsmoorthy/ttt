import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { mockAdmin } from "../mocks/data";
import { renderApp } from "../test-utils";

describe("Create fixtures", () => {
  it("generates fixtures for a league stage", async () => {
    const user = userEvent.setup();

    renderApp({
      route: "/tournaments/summer-open-2026/fixtures/league",
      user: mockAdmin,
    });

    await screen.findByText("Alice");
    await user.click(screen.getByRole("button", { name: "Create Fixtures" }));

    expect(await screen.findByText(/Summary:/i)).toBeInTheDocument();
    expect(screen.getByText("Group A")).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "1" })).toBeInTheDocument();
    expect(screen.getAllByText("Bob").length).toBeGreaterThan(0);
  });
});