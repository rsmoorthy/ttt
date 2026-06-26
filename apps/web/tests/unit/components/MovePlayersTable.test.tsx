import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MovePlayersTable } from "../../../src/components/move-players/MovePlayersTable";

describe("MovePlayersTable", () => {
  it("renders leaderboard columns with selection checkboxes", async () => {
    const user = userEvent.setup();
    const onTogglePlayer = vi.fn();

    render(
      <MovePlayersTable
        entries={[
          {
            rank: 1,
            player_name: "Alice",
            wins: 2,
            nrr: 2.1,
            swlr: 2,
            pwlr: 1.2,
          },
        ]}
        completedMatches={1}
        totalMatches={1}
        selectedPlayers={new Set()}
        onTogglePlayer={onTogglePlayer}
      />,
    );

    expect(screen.getByText("Total matches completed: 1/1")).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Select" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Rank" })).toBeInTheDocument();
    expect(screen.getByLabelText("Select Alice")).toBeInTheDocument();

    await user.click(screen.getByLabelText("Select Alice"));
    expect(onTogglePlayer).toHaveBeenCalledWith("Alice");
  });

  it("shows an empty state when there are no entries", () => {
    render(
      <MovePlayersTable
        entries={[]}
        completedMatches={0}
        totalMatches={0}
        selectedPlayers={new Set()}
        onTogglePlayer={() => undefined}
      />,
    );

    expect(
      screen.getByText("No players on the leaderboard yet."),
    ).toBeInTheDocument();
  });
});