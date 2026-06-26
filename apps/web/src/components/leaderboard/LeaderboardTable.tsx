import { MatchCompletionSummary } from "../matches/MatchCompletionSummary";
import type { LeaderboardEntry } from "../../types/leaderboard";
import { formatNrr, formatRatio } from "../../utils/leaderboard";

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
                Wins
              </th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">
                NRR
              </th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">
                Set W/L ratio
              </th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">
                Points W/L ratio
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