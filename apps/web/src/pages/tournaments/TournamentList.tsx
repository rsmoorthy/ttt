import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  deleteTournament,
  listTournaments,
} from "../../api/tournaments";
import { ApiError } from "../../api/client";
import { Button } from "../../components/ui/Button";
import { PageHeader } from "../../components/ui/PageHeader";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { useErrorBanner } from "../../context/error-context";
import type { Tournament } from "../../types/tournament";
import { truncate } from "../../utils/truncate";

export function TournamentListPage() {
  const { setError, clearError } = useErrorBanner();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingSlug, setDeletingSlug] = useState<string | null>(null);

  const loadTournaments = useCallback(async () => {
    clearError();
    setLoading(true);
    try {
      const response = await listTournaments();
      setTournaments(response.tournaments);
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Failed to load tournaments";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [clearError, setError]);

  useEffect(() => {
    loadTournaments();
  }, [loadTournaments]);

  async function handleDelete(tournament: Tournament) {
    const confirmed = window.confirm(
      `Delete tournament ${tournament.name}? This cannot be undone.`,
    );
    if (!confirmed) {
      return;
    }

    clearError();
    setDeletingSlug(tournament.slug);
    try {
      await deleteTournament(tournament.slug);
      await loadTournaments();
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Failed to delete tournament";
      setError(message);
    } finally {
      setDeletingSlug(null);
    }
  }

  return (
    <div>
      <PageHeader
        title="Tournaments"
        action={
          <Link to="/tournaments/new">
            <Button>Create Tournament</Button>
          </Link>
        }
      />

      {loading ? (
        <p className="text-sm text-slate-500">Loading tournaments…</p>
      ) : tournaments.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
          No tournaments yet. Create one to get started.
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
                  Description
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">
                  Status
                </th>
                <th className="px-4 py-3 text-right font-semibold text-slate-700">
                  Actions
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
                  <td className="max-w-xs px-4 py-3 text-slate-600">
                    {tournament.description
                      ? truncate(tournament.description, 60)
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={tournament.status} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex gap-2">
                      <Link
                        to={`/tournaments/${tournament.slug}/edit`}
                        className="text-sm font-medium text-brand-700 hover:text-brand-800"
                      >
                        Edit
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDelete(tournament)}
                        disabled={deletingSlug === tournament.slug}
                        className="text-sm font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </div>
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