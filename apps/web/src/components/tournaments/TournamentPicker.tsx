import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listTournaments } from "../../api/tournaments";
import { ApiError } from "../../api/client";
import { PageHeader } from "../ui/PageHeader";
import { StatusBadge } from "../ui/StatusBadge";
import { useErrorBanner } from "../../context/error-context";
import type { Tournament } from "../../types/tournament";

interface TournamentPickerProps {
  title: string;
  buildPath: (slug: string) => string;
}

export function TournamentPicker({ title, buildPath }: TournamentPickerProps) {
  const { setError, clearError } = useErrorBanner();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    clearError();
    setLoading(true);

    listTournaments()
      .then((response) => setTournaments(response.tournaments))
      .catch((err) => {
        const message =
          err instanceof ApiError ? err.message : "Failed to load tournaments";
        setError(message);
      })
      .finally(() => setLoading(false));
  }, [clearError, setError]);

  return (
    <div>
      <PageHeader title={title} />

      {loading ? (
        <p className="text-sm text-slate-500">Loading tournaments…</p>
      ) : tournaments.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
          No tournaments available.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">
                  Name
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">
                  Slug
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">
                  Status
                </th>
                <th className="px-4 py-3 text-right font-semibold text-slate-700">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tournaments.map((tournament) => (
                <tr key={tournament.slug} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {tournament.name}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {tournament.slug}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={tournament.status} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      to={buildPath(tournament.slug)}
                      className="text-sm font-medium text-brand-700 hover:text-brand-800"
                    >
                      Open
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}