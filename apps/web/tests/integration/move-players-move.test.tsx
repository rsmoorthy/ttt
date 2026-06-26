import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { mockAdmin } from "../mocks/data";
import { renderApp } from "../test-utils";

describe("Move players action", () => {
  it("moves selected players to the target stage after confirmation", async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);

    renderApp({
      route: "/tournaments/summer-open-2026/move-players/league",
      user: mockAdmin,
      seedFixtures: [{ scored: true }],
    });

    await screen.findByLabelText("Select Alice");
    await user.click(screen.getByLabelText("Select Alice"));
    await user.selectOptions(screen.getByLabelText("Target stage"), "qf");
    await user.click(screen.getByRole("button", { name: "Move to Stage" }));

    expect(confirmSpy).toHaveBeenCalledWith(
      "Move 1 player(s) to Quarter Finals? This replaces the player list for that stage.",
    );

    expect(
      await screen.findByText(
        "Moved 1 player(s) to Quarter Finals successfully.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Select Alice")).not.toBeChecked();

    confirmSpy.mockRestore();
  });

  it("does not move players when confirmation is cancelled", async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(false);

    renderApp({
      route: "/tournaments/summer-open-2026/move-players/league",
      user: mockAdmin,
      seedFixtures: [{ scored: true }],
    });

    await screen.findByLabelText("Select Alice");
    await user.click(screen.getByLabelText("Select Alice"));
    await user.selectOptions(screen.getByLabelText("Target stage"), "qf");
    await user.click(screen.getByRole("button", { name: "Move to Stage" }));

    expect(confirmSpy).toHaveBeenCalled();
    expect(
      screen.queryByText(/Moved .* successfully\./),
    ).toBeNull();
    expect(screen.getByLabelText("Select Alice")).toBeChecked();

    confirmSpy.mockRestore();
  });

  it("keeps move disabled until players and target stage are selected", async () => {
    renderApp({
      route: "/tournaments/summer-open-2026/move-players/league",
      user: mockAdmin,
      seedFixtures: [{ scored: true }],
    });

    const moveButton = await screen.findByRole("button", {
      name: "Move to Stage",
    });
    expect(moveButton).toBeDisabled();
  });
});