import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { mockAdmin } from "../mocks/data";
import { renderApp } from "../test-utils";

describe("Overwrite schedule", () => {
  it("asks for confirmation before replacing an existing schedule", async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(false);

    renderApp({
      route: "/tournaments/summer-open-2026/schedule/league",
      user: mockAdmin,
      withLeagueFixtures: true,
    });

    await screen.findByText("1. Alice vs Bob");
    await user.click(screen.getByRole("button", { name: "Schedule" }));
    await screen.findByText("1. Alice vs Bob");

    await user.click(screen.getByRole("button", { name: "Schedule" }));

    expect(confirmSpy).toHaveBeenCalled();
    expect(screen.getByText("1. Alice vs Bob")).toBeInTheDocument();

    confirmSpy.mockRestore();
  });

  it("reschedules when confirmation is accepted", async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);

    renderApp({
      route: "/tournaments/summer-open-2026/schedule/league",
      user: mockAdmin,
      withLeagueFixtures: true,
    });

    await screen.findByText("1. Alice vs Bob");
    await user.click(screen.getByRole("button", { name: "Schedule" }));
    await screen.findByText("1. Alice vs Bob");

    await user.click(screen.getByRole("button", { name: "Schedule" }));

    await waitFor(() => {
      expect(confirmSpy).toHaveBeenCalled();
    });

    confirmSpy.mockRestore();
  });
});