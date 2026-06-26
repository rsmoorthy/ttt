import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { mockSuperadmin } from "../mocks/data";
import { renderApp } from "../test-utils";

describe("Tournament list", () => {
  it("loads and displays tournaments for superadmin", async () => {
    renderApp({ route: "/tournaments", user: mockSuperadmin });

    expect(await screen.findByRole("heading", { name: "Tournaments" }))
      .toBeInTheDocument();
    expect(await screen.findByText("Summer Open 2026")).toBeInTheDocument();
    expect(screen.getByText("winter-league")).toBeInTheDocument();
    expect(screen.getByText("open")).toBeInTheDocument();
    expect(screen.getByText("closed")).toBeInTheDocument();
  });

  it("deletes a tournament after confirmation", async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);

    renderApp({ route: "/tournaments", user: mockSuperadmin });

    await screen.findByText("Summer Open 2026");

    const deleteButtons = screen.getAllByRole("button", { name: "Delete" });
    await user.click(deleteButtons[0]);

    await waitFor(() => {
      expect(screen.queryByText("Summer Open 2026")).not.toBeInTheDocument();
    });

    expect(screen.getByText("Winter League")).toBeInTheDocument();
    expect(confirmSpy).toHaveBeenCalled();
    confirmSpy.mockRestore();
  });
});