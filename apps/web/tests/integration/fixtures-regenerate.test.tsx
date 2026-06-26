import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { mockAdmin } from "../mocks/data";
import { renderApp } from "../test-utils";

describe("Regenerate fixtures", () => {
  it("asks for confirmation before replacing existing fixtures", async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(false);

    renderApp({
      route: "/tournaments/summer-open-2026/fixtures/league",
      user: mockAdmin,
    });

    await screen.findByText("Alice");
    await user.click(screen.getByRole("button", { name: "Create Fixtures" }));
    await screen.findByText(/Summary:/i);

    await user.click(screen.getByRole("button", { name: "Create Fixtures" }));

    expect(confirmSpy).toHaveBeenCalled();
    expect(screen.getByText(/Summary:/i)).toBeInTheDocument();

    confirmSpy.mockRestore();
  });

  it("regenerates fixtures when confirmation is accepted", async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);

    renderApp({
      route: "/tournaments/summer-open-2026/fixtures/league",
      user: mockAdmin,
    });

    await screen.findByText("Alice");
    await user.click(screen.getByRole("button", { name: "Create Fixtures" }));
    await screen.findByText(/Summary:/i);

    await user.click(screen.getByRole("button", { name: "Create Fixtures" }));

    await waitFor(() => {
      expect(confirmSpy).toHaveBeenCalled();
    });

    confirmSpy.mockRestore();
  });
});