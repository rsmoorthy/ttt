import {
  buildScheduleGrid,
  filterScheduleMatches,
  hasExistingSchedule,
  LEAGUE_ONLY_SCHEDULE_MESSAGE,
  schedulePlayerOptions,
  SCHEDULE_OVERWRITE_CONFIRM,
  showScheduleControls,
} from "../../../src/utils/schedule";

const baseMatch = {
  player1: "Alice",
  player2: "Bob",
  tbl: null as number | null,
  hour_slot: null as number | null,
  is_completed: false,
};

describe("schedule utils", () => {
  it("shows schedule controls only for league stages", () => {
    expect(showScheduleControls("league")).toBe(true);
    expect(showScheduleControls("superleague")).toBe(false);
    expect(showScheduleControls("playoff")).toBe(false);
  });

  it("detects existing schedule from hour_slot or tbl", () => {
    expect(
      hasExistingSchedule([
        { slno: 1, ...baseMatch },
      ]),
    ).toBe(false);

    expect(
      hasExistingSchedule([
        { slno: 1, ...baseMatch, tbl: 1 },
      ]),
    ).toBe(true);

    expect(
      hasExistingSchedule([
        { slno: 1, ...baseMatch, hour_slot: 2 },
      ]),
    ).toBe(true);
  });

  it("builds a scheduled grid grouped by hour slot and table", () => {
    const grid = buildScheduleGrid([
      { slno: 1, ...baseMatch, tbl: 1, hour_slot: 1 },
      {
        slno: 2,
        player1: "Alice",
        player2: "Carol",
        tbl: 2,
        hour_slot: 1,
        is_completed: false,
      },
      {
        slno: 3,
        player1: "Bob",
        player2: "Carol",
        tbl: 1,
        hour_slot: 2,
        is_completed: false,
      },
    ]);

    expect(grid).not.toBeNull();
    expect(grid?.tableCount).toBe(2);
    expect(grid?.rows).toHaveLength(2);
    expect(grid?.rows[0].hourSlot).toBe(1);
    expect(grid?.rows[0].hourSlotRowSpan).toBe(1);
    expect(grid?.rows[0].tables[0]?.slno).toBe(1);
    expect(grid?.rows[0].tables[1]?.slno).toBe(2);
    expect(grid?.rows[1].hourSlot).toBe(2);
    expect(grid?.rows[1].tables[0]?.slno).toBe(3);
  });

  it("returns null for an unscheduled grid", () => {
    expect(
      buildScheduleGrid([
        { slno: 1, ...baseMatch },
      ]),
    ).toBeNull();
  });

  it("builds player options and filters matches by player and completion", () => {
    const matches = [
      { slno: 1, ...baseMatch },
      {
        slno: 2,
        player1: "Alice",
        player2: "Carol",
        tbl: null,
        hour_slot: null,
        is_completed: true,
      },
      {
        slno: 3,
        player1: "Bob",
        player2: "Carol",
        tbl: null,
        hour_slot: null,
        is_completed: false,
      },
    ];

    expect(schedulePlayerOptions(matches)).toEqual(["Alice", "Bob", "Carol"]);

    expect(
      filterScheduleMatches(matches, { player: "Carol", completion: "" }),
    ).toHaveLength(2);

    expect(
      filterScheduleMatches(matches, { player: "", completion: "pending" }),
    ).toEqual([matches[0], matches[2]]);

    expect(
      filterScheduleMatches(matches, { player: "", completion: "completed" }),
    ).toEqual([matches[1]]);
  });

  it("defines confirmation and league-only copy", () => {
    expect(SCHEDULE_OVERWRITE_CONFIRM).toContain("overwrite");
    expect(LEAGUE_ONLY_SCHEDULE_MESSAGE).toContain("league stages only");
  });
});