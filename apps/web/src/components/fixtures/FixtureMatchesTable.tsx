import type { FixtureMatchRow } from "../../types/fixtures";

interface FixtureMatchesTableProps {
  matches: FixtureMatchRow[];
}

export function FixtureMatchesTable({ matches }: FixtureMatchesTableProps) {
  return (
    <section className="space-y-3">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
        Matches
      </h3>
      {matches.length === 0 ? (
        <p className="text-sm text-slate-500">No matches generated yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">
                  Slno
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">
                  Player 1
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">
                  Player 2
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {matches.map((match) => (
                <tr key={match.slno}>
                  <td className="px-4 py-3 text-slate-600">{match.slno}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {match.player1}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {match.player2}
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