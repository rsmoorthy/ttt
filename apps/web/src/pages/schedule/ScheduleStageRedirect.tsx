import { useEffect, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import { listStages } from "../../api/stages";
import { ApiError } from "../../api/client";
import { NoStagesMessage } from "../../components/layout/NoStagesMessage";
import { useErrorBanner } from "../../context/error-context";
import type { Stage } from "../../types/stage";

export function ScheduleStageRedirect() {
  const { slug = "" } = useParams();
  const { setError, clearError } = useErrorBanner();
  const [stages, setStages] = useState<Stage[] | null>(null);

  useEffect(() => {
    clearError();
    listStages(slug)
      .then((response) => setStages(response.stages))
      .catch((err) => {
        const message =
          err instanceof ApiError ? err.message : "Failed to load stages";
        setError(message);
        setStages([]);
      });
  }, [slug, clearError, setError]);

  if (stages === null) {
    return <p className="text-sm text-slate-500">Loading stages…</p>;
  }

  if (stages.length === 0) {
    return <NoStagesMessage tournamentSlug={slug} />;
  }

  return (
    <Navigate
      to={`/tournaments/${slug}/schedule/${stages[0].slug}`}
      replace
    />
  );
}