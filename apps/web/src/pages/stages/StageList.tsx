import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { deleteStage, listStages } from "../../api/stages";
import { getTournament } from "../../api/tournaments";
import { ApiError } from "../../api/client";
import { Button } from "../../components/ui/Button";
import { PageHeader } from "../../components/ui/PageHeader";
import { hasMinimumRole } from "../../constants/navigation";
import { useAuth } from "../../context/auth-context";
import { useErrorBanner } from "../../context/error-context";
import type { Stage } from "../../types/stage";
import { formatCompleted, formatStageType } from "../../utils/stage";
import { truncate } from "../../utils/truncate";

export function StageListPage() {
  const { slug = "" } = useParams();
  const { user } = useAuth();
  const { setError, clearError } = useErrorBanner();
  const [tournamentName, setTournamentName] = useState("");
  const [stages, setStages] = useState<Stage[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingSlug, setDeletingSlug] = useState<string | null>(null);

  const canEdit = user ? hasMinimumRole(user.role, "admin") : false;

  const loadStages = useCallback(async () => {
    clearError();
    setLoading(true);

    try {
      const [tournament, response] = await Promise.all([
        getTournament(slug),
        listStages(slug),
      ]);
      setTournamentName(tournament.name);
      setStages(response.stages);
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Failed to load stages";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [slug, clearError, setError]);

  useEffect(() => {
    loadStages();
  }, [loadStages]);

  async function handleDelete(stage: Stage) {
    const confirmed = window.confirm(
      `Delete stage ${stage.name}? All fixtures and scores for this stage will be removed.`,
    );
    if (!confirmed) {
      return;
    }

    clearError();
    setDeletingSlug(stage.slug);
    try {
      await deleteStage(slug, stage.slug);
      await loadStages();
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Failed to delete stage";
      setError(message);
    } finally {
      setDeletingSlug(null);
    }
  }

  return (
    <div>
      <PageHeader
        title={tournamentName || slug}
        action={
          canEdit ? (
            <Link to={`/tournaments/${slug}/stages/new`}>
              <Button>Create Stage</Button>
            </Link>
          ) : undefined
        }
      />

      {loading ? (
        <p className="text-sm text-slate-500">Loading stages…</p>
      ) : stages.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
          No stages yet.
          {canEdit ? " Create one to get started." : null}
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
                  Stage type
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">
                  Description
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">
                  Completed
                </th>
                {canEdit ? (
                  <th className="px-4 py-3 text-right font-semibold text-slate-700">
                    Actions
                  </th>
                ) : null}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stages.map((stage) => (
                <tr key={stage.slug} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {stage.name}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{stage.slug}</td>
                  <td className="px-4 py-3 text-slate-700">
                    {formatStageType(stage.stage_type)}
                  </td>
                  <td className="max-w-xs px-4 py-3 text-slate-600">
                    {stage.description
                      ? truncate(stage.description, 60)
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {formatCompleted(stage.is_completed)}
                  </td>
                  {canEdit ? (
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex gap-2">
                        <Link
                          to={`/tournaments/${slug}/stages/${stage.slug}/edit`}
                          className="text-sm font-medium text-brand-700 hover:text-brand-800"
                        >
                          Edit
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDelete(stage)}
                          disabled={deletingSlug === stage.slug}
                          className="text-sm font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}