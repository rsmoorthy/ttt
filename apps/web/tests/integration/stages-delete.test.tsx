import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { mockAdmin } from "../mocks/data";
import { renderApp } from "../test-utils";

describe("Delete stage", () => {
  it("deletes a stage after confirmation", async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);

    renderApp({
      route: "/tournaments/summer-open-2026/stages",
      user: mockAdmin,
    });

    await screen.findByText("Quarter Finals");

    const deleteButtons = screen.getAllByRole("button", { name: "Delete" });
    await user.click(deleteButtons[0]);

    await waitFor(() => {
      expect(screen.queryByText("league")).not.toBeInTheDocument();
    });

    expect(screen.getByText("Quarter Finals")).toBeInTheDocument();
    expect(confirmSpy).toHaveBeenCalled();
    confirmSpy.mockRestore();
  });
});