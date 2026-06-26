import type { ScheduleMatch } from "../types/schedule";
import type { StageType } from "../types/stage";

export const SCHEDULE_OVERWRITE_CONFIRM =
  "This action overwrites the earlier schedule. Continue?";

export const LEAGUE_ONLY_SCHEDULE_MESSAGE =
  "Automated scheduling is available for league stages only. Knockout fixtures are few — set table and hour slot manually when needed.";

export interface ScheduleGridRow {
  hourSlot: number | null;
  hourSlotRowSpan: number;
  tables: Array<ScheduleMatch | null>;
}

export interface ScheduleGrid {
  tableCount: number;
  rows: ScheduleGridRow[];
}

export function showScheduleControls(stageType: StageType): boolean {
  return stageType === "league";
}

export function hasExistingSchedule(matches: ScheduleMatch[]): boolean {
  return matches.some(
    (match) => match.hour_slot !== null || match.tbl !== null,
  );
}

export function buildScheduleGrid(
  matches: ScheduleMatch[],
): ScheduleGrid | null {
  if (!hasExistingSchedule(matches)) {
    return null;
  }

  const tableCount = Math.max(0, ...matches.map((match) => match.tbl ?? 0));
  if (tableCount === 0) {
    return null;
  }

  const hourSlots = [
    ...new Set(
      matches
        .map((match) => match.hour_slot)
        .filter((slot): slot is number => slot !== null),
    ),
  ].sort((left, right) => left - right);

  const rows: ScheduleGridRow[] = [];

  for (const hourSlot of hourSlots) {
    const inSlot = matches.filter((match) => match.hour_slot === hourSlot);
    const byTable = new Map<number, ScheduleMatch[]>();

    for (let table = 1; table <= tableCount; table += 1) {
      byTable.set(
        table,
        inSlot
          .filter((match) => match.tbl === table)
          .sort((left, right) => left.slno - right.slno),
      );
    }

    const rowspan = Math.max(
      ...Array.from(byTable.values()).map((tableMatches) => tableMatches.length),
      0,
    );

    for (let rowIndex = 0; rowIndex < rowspan; rowIndex += 1) {
      rows.push({
        hourSlot: rowIndex === 0 ? hourSlot : null,
        hourSlotRowSpan: rowIndex === 0 ? rowspan : 0,
        tables: Array.from({ length: tableCount }, (_, tableIndex) => {
          const tableMatches = byTable.get(tableIndex + 1) ?? [];
          const match = tableMatches[rowIndex];
          return match ?? null;
        }),
      });
    }
  }

  return { tableCount, rows };
}