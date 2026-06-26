import { render, screen } from "@testing-library/react";
import { LeaderboardTable } from "../../../src/components/leaderboard/LeaderboardTable";

describe("LeaderboardTable", () => {
  it("renders leaderboard columns and formatted values", () => {
    render(
      <LeaderboardTable
        completedMatches={1}
        totalMatches={3}
        entries={[
          {
            rank: 1,
            player_name: "Alice",
            wins: 3,
            nrr: 2.855,
            swlr: 2.5,
            pwlr: 1.35,
          },
          {
            rank: 2,
            player_name: "Bob",
            wins: 2,
            nrr: 2.1,
            swlr: 1.5,
            pwlr: 0.9,
          },
        ]}
      />,
    );

    expect(screen.getByText("Total matches completed: 1/3")).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Rank" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Player" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Wins" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "NRR" })).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: "Set W/L ratio" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: "Points W/L ratio" }),
    ).toBeInTheDocument();

    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("2.8550")).toBeInTheDocument();
    expect(screen.getByText("2.50")).toBeInTheDocument();
    expect(screen.getByText("1.35")).toBeInTheDocument();
  });

  it("shows an empty state when there are no entries", () => {
    render(
      <LeaderboardTable
        entries={[]}
        completedMatches={0}
        totalMatches={0}
      />,
    );
    expect(screen.getByText("No leaderboard entries yet.")).toBeInTheDocument();
  });
});