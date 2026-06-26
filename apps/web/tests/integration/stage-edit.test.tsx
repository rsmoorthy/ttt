import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { mockAdmin } from "../mocks/data";
import { renderApp } from "../test-utils";

describe("Edit stage", () => {
  it("loads an existing stage and saves changes", async () => {
    const user = userEvent.setup();

    renderApp({
      route: "/tournaments/summer-open-2026/stages/league/edit",
      user: mockAdmin,
    });

    expect(
      await screen.findByRole("heading", { name: "Edit Stage — League" }),
    ).toBeInTheDocument();

    const nameInput = screen.getByLabelText(/^name$/i);
    expect(nameInput).toHaveValue("League");
    expect(screen.getByText("league")).toBeInTheDocument();

    await user.clear(nameInput);
    await user.type(nameInput, "League Stage");
    await user.click(screen.getByLabelText(/is completed/i));
    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Summer Open 2026" }),
      ).toBeInTheDocument();
    });

    expect(screen.getByText("League Stage")).toBeInTheDocument();
    expect(screen.getAllByText("Yes").length).toBeGreaterThan(0);
  });
});