import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ScoresMatchesTable } from "../../../src/components/scores/ScoresMatchesTable";

const sampleMatch = {
  slno: 1,
  player1: "Alice",
  player2: "Bob",
  tbl: 1,
  hour_slot: 1,
  game1: "11-7",
  game2: "9-11",
  game3: "11-8",
  game4: "",
  game5: "",
  walkover_win: "",
  is_completed: false,
};

const tableProps = {
  completedMatches: 0,
  totalMatches: 1,
};

describe("ScoresMatchesTable", () => {
  it("renders match rows and read-only controls for guests", () => {
    render(
      <ScoresMatchesTable
        matches={[sampleMatch]}
        {...tableProps}
        role="guest"
        savingSlno={null}
        fieldErrors={{}}
        onFieldErrorsChange={() => undefined}
        onRowClick={() => undefined}
        onInvalidScoreCommit={() => undefined}
        onPatch={async () => true}
        onComplete={async () => undefined}
      />,
    );

    expect(screen.getByText("Total matches completed: 0/1")).toBeInTheDocument();
    expect(screen.getAllByText("Alice").length).toBeGreaterThan(0);
    expect(screen.getByLabelText("game1 for match 1")).toHaveAttribute(
      "readonly",
    );
    expect(screen.queryByRole("button", { name: "Match Over" })).toBeNull();
  });

  it("reports validation errors for invalid scores", async () => {
    const user = userEvent.setup();
    const onFieldErrorsChange = vi.fn();
    const onInvalidScoreCommit = vi.fn();
    const onPatch = vi.fn(async () => true);

    render(
      <ScoresMatchesTable
        matches={[{ ...sampleMatch, game1: "" }]}
        {...tableProps}
        role="scorer"
        savingSlno={null}
        fieldErrors={{}}
        onFieldErrorsChange={onFieldErrorsChange}
        onRowClick={() => undefined}
        onInvalidScoreCommit={onInvalidScoreCommit}
        onPatch={onPatch}
        onComplete={async () => undefined}
      />,
    );

    const gameInput = screen.getByLabelText("game1 for match 1");
    await user.type(gameInput, "5-5");
    await user.tab();

    expect(onFieldErrorsChange).toHaveBeenCalled();
    expect(onInvalidScoreCommit).toHaveBeenCalledWith(1, "game1");
    expect(onPatch).not.toHaveBeenCalled();
  });

  it("disables match over when players have equal game wins", () => {
    render(
      <ScoresMatchesTable
        matches={[
          {
            ...sampleMatch,
            game1: "11-7",
            game2: "9-11",
            game3: "",
          },
        ]}
        {...tableProps}
        role="scorer"
        savingSlno={null}
        fieldErrors={{}}
        onFieldErrorsChange={() => undefined}
        onRowClick={() => undefined}
        onInvalidScoreCommit={() => undefined}
        onPatch={async () => true}
        onComplete={async () => undefined}
      />,
    );

    expect(screen.getByRole("button", { name: "Match Over" })).toBeDisabled();
  });

  it("highlights completed rows", () => {
    render(
      <ScoresMatchesTable
        matches={[{ ...sampleMatch, is_completed: true }]}
        completedMatches={1}
        totalMatches={1}
        role="scorer"
        savingSlno={null}
        fieldErrors={{}}
        onFieldErrorsChange={() => undefined}
        onRowClick={() => undefined}
        onInvalidScoreCommit={() => undefined}
        onPatch={async () => true}
        onComplete={async () => undefined}
      />,
    );

    expect(screen.getByText("Total matches completed: 1/1")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Completed" }).closest("tr"),
    ).toHaveClass("bg-emerald-50");
  });

  it("calls complete for scorer roles", async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn(async () => undefined);

    render(
      <ScoresMatchesTable
        matches={[
          {
            ...sampleMatch,
            game1: "11-7",
            game2: "11-5",
            game3: "",
          },
        ]}
        {...tableProps}
        role="scorer"
        savingSlno={null}
        fieldErrors={{}}
        onFieldErrorsChange={() => undefined}
        onRowClick={() => undefined}
        onInvalidScoreCommit={() => undefined}
        onPatch={async () => true}
        onComplete={onComplete}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Match Over" }));
    expect(onComplete).toHaveBeenCalledWith(1);
  });
});