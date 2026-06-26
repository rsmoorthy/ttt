import { render, screen } from "@testing-library/react";
import { FixtureMatchesTable } from "../../../src/components/fixtures/FixtureMatchesTable";

describe("FixtureMatchesTable", () => {
  it("renders match rows", () => {
    render(
      <FixtureMatchesTable
        matches={[
          { slno: 1, player1: "Alice", player2: "Bob" },
          { slno: 2, player1: "Alice", player2: "Carol" },
        ]}
      />,
    );

    expect(screen.getByRole("cell", { name: "1" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "2" })).toBeInTheDocument();
    expect(screen.getAllByText("Alice").length).toBeGreaterThan(0);
    expect(screen.getByText("Carol")).toBeInTheDocument();
  });

  it("shows an empty state", () => {
    render(<FixtureMatchesTable matches={[]} />);
    expect(screen.getByText("No matches generated yet.")).toBeInTheDocument();
  });
});