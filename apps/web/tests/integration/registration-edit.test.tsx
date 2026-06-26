import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { mockAdmin } from "../mocks/data";
import { renderApp } from "../test-utils";

describe("Registration edit view", () => {
  it("lets admins save player changes", async () => {
    const user = userEvent.setup();

    renderApp({
      route: "/tournaments/summer-open-2026/registration",
      user: mockAdmin,
    });

    const playerOne = await screen.findByLabelText("Player 1");
    expect(playerOne).toHaveValue("Alice");

    await user.clear(playerOne);
    await user.type(playerOne, "Alicia");
    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(screen.getByLabelText("Player 1")).toHaveValue("Alicia");
    });
    expect(screen.queryByText("Alice")).toBeNull();
  });

  it("reloads from the server when cancel is clicked", async () => {
    const user = userEvent.setup();

    renderApp({
      route: "/tournaments/summer-open-2026/registration",
      user: mockAdmin,
    });

    const playerOne = await screen.findByLabelText("Player 1");
    await user.clear(playerOne);
    await user.type(playerOne, "Temporary Name");
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    await waitFor(() => {
      expect(screen.getByLabelText("Player 1")).toHaveValue("Alice");
    });
  });
});