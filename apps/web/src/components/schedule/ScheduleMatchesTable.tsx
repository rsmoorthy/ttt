import { MatchCompletionSummary } from "../matches/MatchCompletionSummary";
import { ScheduleMatchLabel } from "../matches/ScheduleMatchLabel";
import type { ScheduleMatch } from "../../types/schedule";
import { countMatchCompletion } from "../../utils/matches";
import { buildScheduleGrid, hasExistingSchedule } from "../../utils/schedule";

interface ScheduleMatchesTableProps {
  matches: ScheduleMatch[];
  completedMatches?: number;
  totalMatches?: number;
}

function resolveMatchSummary(
  matches: ScheduleMatch[],
  completedMatches?: number,
  totalMatches?: number,
) {
  if (completedMatches !== undefined && totalMatches !== undefined) {
    return { completed: completedMatches, total: totalMatches };
  }

  return countMatchCompletion(matches);
}

function UnscheduledMatchesTable({
  matches,
  completedMatches,
  totalMatches,
}: ScheduleMatchesTableProps) {
  const summary = resolveMatchSummary(matches, completedMatches, totalMatches);

  return (
    <section className="space-y-3">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
        Matches
      </h3>
      <MatchCompletionSummary
        completed={summary.completed}
        total={summary.total}
      />
      {matches.length === 0 ? (
        <p className="text-sm text-slate-500">No matches to schedule.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">
                  Match
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">
                  Hour slot
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">
                  Table
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {matches.map((match) => (
                <tr key={match.slno}>
                  <td className="px-4 py-3 font-medium text-slate-900">
                    <ScheduleMatchLabel match={match} />
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {match.hour_slot ?? ""}
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {match.tbl ?? ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function ScheduledMatchesGrid({
  matches,
  completedMatches,
  totalMatches,
}: ScheduleMatchesTableProps) {
  const grid = buildScheduleGrid(matches);
  const summary = resolveMatchSummary(matches, completedMatches, totalMatches);

  if (!grid) {
    return <UnscheduledMatchesTable matches={matches} />;
  }

  return (
    <section className="space-y-3">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
        Schedule
      </h3>
      <MatchCompletionSummary
        completed={summary.completed}
        total={summary.total}
      />
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">
                Hour slot
              </th>
              {Array.from({ length: grid.tableCount }, (_, index) => (
                <th
                  key={index + 1}
                  className="px-4 py-3 text-left font-semibold text-slate-700"
                >
                  Matches in Table {index + 1}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {grid.rows.map((row, rowIndex) => (
              <tr key={`${row.hourSlot ?? "cont"}-${rowIndex}`}>
                {row.hourSlot !== null ? (
                  <td
                    rowSpan={row.hourSlotRowSpan}
                    className="px-4 py-3 align-top font-semibold text-slate-900"
                  >
                    {row.hourSlot}
                  </td>
                ) : null}
                {row.tables.map((match, tableIndex) => (
                  <td
                    key={tableIndex}
                    className="px-4 py-3 text-slate-700"
                  >
                    {match ? <ScheduleMatchLabel match={match} /> : null}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function ScheduleMatchesTable({
  matches,
  completedMatches,
  totalMatches,
}: ScheduleMatchesTableProps) {
  if (hasExistingSchedule(matches)) {
    return (
      <ScheduledMatchesGrid
        matches={matches}
        completedMatches={completedMatches}
        totalMatches={totalMatches}
      />
    );
  }

  return (
    <UnscheduledMatchesTable
      matches={matches}
      completedMatches={completedMatches}
      totalMatches={totalMatches}
    />
  );
}