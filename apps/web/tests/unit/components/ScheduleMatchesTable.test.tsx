import { render, screen } from "@testing-library/react";
import { ScheduleMatchesTable } from "../../../src/components/schedule/ScheduleMatchesTable";

const baseMatch = {
  player1: "Alice",
  player2: "Bob",
  tbl: null as number | null,
  hour_slot: null as number | null,
  is_completed: false,
};

describe("ScheduleMatchesTable", () => {
  it("renders the unscheduled fixtures table with match labels", () => {
    render(
      <ScheduleMatchesTable
        matches={[
          { slno: 1, ...baseMatch },
          {
            slno: 2,
            player1: "Alice",
            player2: "Carol",
            tbl: null,
            hour_slot: null,
            is_completed: false,
          },
        ]}
      />,
    );

    expect(screen.getByText("Total matches completed: 0/2")).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Match" })).toBeInTheDocument();
    expect(screen.getByText("1. Alice vs Bob")).toBeInTheDocument();
    expect(screen.getByText("2. Alice vs Carol")).toBeInTheDocument();
  });

  it("renders the scheduled grid grouped by hour slot and table", () => {
    render(
      <ScheduleMatchesTable
        matches={[
          { slno: 1, ...baseMatch, tbl: 1, hour_slot: 1 },
          {
            slno: 2,
            player1: "Alice",
            player2: "Carol",
            tbl: 2,
            hour_slot: 1,
            is_completed: true,
          },
        ]}
      />,
    );

    expect(screen.getByText("Total matches completed: 1/2")).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Matches in Table 1" })).toBeInTheDocument();
    expect(screen.getByText("1. Alice vs Bob")).toBeInTheDocument();
    expect(screen.getByText("2. Alice vs Carol")).toBeInTheDocument();
    expect(screen.getByLabelText("Completed")).toBeInTheDocument();
  });

  it("shows an empty state", () => {
    render(<ScheduleMatchesTable matches={[]} />);
    expect(screen.getByText("No matches to schedule.")).toBeInTheDocument();
  });
});