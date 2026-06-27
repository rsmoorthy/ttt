import { MatchCompletionSummary } from "../matches/MatchCompletionSummary";
import { InfoLabel } from "../ui/InfoLabel";
import type { LeaderboardEntry } from "../../types/leaderboard";
import { formatNrr, formatRatio } from "../../utils/leaderboard";

const NRR_HELP =
  "Calc done as ((SWLR*100) + PWLR)/100). Higher the value, ranks higher (if wins are same)";
const SWLR_HELP =
  "SWLR - Calc done as (sets_won/sets_lost). If 0 sets are lost, then 99 is taken as SWLR";
const PWLR_HELP =
  "PWLR - Calc done as (points_won/points_lost). If 0 points are lost, then PWLR is set as 99";

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  completedMatches: number;
  totalMatches: number;
}

export function LeaderboardTable({
  entries,
  completedMatches,
  totalMatches,
}: LeaderboardTableProps) {
  if (entries.length === 0) {
    return (
      <section className="space-y-3">
        <MatchCompletionSummary
          completed={completedMatches}
          total={totalMatches}
        />
        <p className="text-sm text-slate-500">No leaderboard entries yet.</p>
      </section>
    );
  }

  return (
    <section className="space-y-3">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
        Leaderboard
      </h3>
      <MatchCompletionSummary
        completed={completedMatches}
        total={totalMatches}
      />
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">
                Rank
              </th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">
                Player
              </th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">
                Played
              </th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">
                Wins
              </th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">
                <InfoLabel label="NRR" info={NRR_HELP} />
              </th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">
                <InfoLabel label="Set W/L ratio" info={SWLR_HELP} />
              </th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">
                <InfoLabel label="Points W/L ratio" info={PWLR_HELP} />
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {entries.map((entry) => (
              <tr key={entry.player_name}>
                <td className="px-4 py-3 text-slate-600">{entry.rank}</td>
                <td className="px-4 py-3 font-medium text-slate-900">
                  {entry.player_name}
                </td>
                <td className="px-4 py-3 text-slate-600">{entry.played}</td>
                <td className="px-4 py-3 text-slate-600">{entry.wins}</td>
                <td className="px-4 py-3 text-slate-600">
                  {formatNrr(entry.nrr)}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {formatRatio(entry.swlr)}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {formatRatio(entry.pwlr)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}