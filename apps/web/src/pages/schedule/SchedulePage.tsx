import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { createSchedule, getSchedule } from "../../api/schedule";
import { listStages } from "../../api/stages";
import { getTournament } from "../../api/tournaments";
import { ApiError } from "../../api/client";
import { NoStagesMessage } from "../../components/layout/NoStagesMessage";
import { StageTabs } from "../../components/layout/StageTabs";
import { NoFixturesMessage } from "../../components/schedule/NoFixturesMessage";
import { ScheduleMatchesTable } from "../../components/schedule/ScheduleMatchesTable";
import { Button } from "../../components/ui/Button";
import { PageHeader } from "../../components/ui/PageHeader";
import { hasMinimumRole } from "../../constants/navigation";
import { useAuth } from "../../context/auth-context";
import { useErrorBanner } from "../../context/error-context";
import type { ScheduleState } from "../../types/schedule";
import type { Stage } from "../../types/stage";
import {
  hasExistingSchedule,
  LEAGUE_ONLY_SCHEDULE_MESSAGE,
  SCHEDULE_OVERWRITE_CONFIRM,
  showScheduleControls,
} from "../../utils/schedule";

export function SchedulePage() {
  const { slug = "", stage: stageSlug = "" } = useParams();
  const { user } = useAuth();
  const { setError, clearError } = useErrorBanner();
  const canEdit = user ? hasMinimumRole(user.role, "admin") : false;
  const [tournamentName, setTournamentName] = useState("");
  const [stages, setStages] = useState<Stage[]>([]);
  const [schedule, setSchedule] = useState<ScheduleState | null>(null);
  const [noFixtures, setNoFixtures] = useState(false);
  const [numSlots, setNumSlots] = useState("7");
  const [numTables, setNumTables] = useState("2");
  const [maxMatchesPerSlot, setMaxMatchesPerSlot] = useState("6");
  const [loading, setLoading] = useState(true);
  const [scheduling, setScheduling] = useState(false);

  const loadPage = useCallback(async () => {
    clearError();
    setLoading(true);
    setNoFixtures(false);

    try {
      const [tournament, stageList] = await Promise.all([
        getTournament(slug),
        listStages(slug),
      ]);

      setTournamentName(tournament.name);
      setStages(stageList.stages);

      try {
        const scheduleState = await getSchedule(slug, stageSlug);
        setSchedule(scheduleState);
      } catch (err) {
        if (err instanceof ApiError && err.status === 409) {
          setSchedule(null);
          setNoFixtures(true);
        } else {
          throw err;
        }
      }
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Failed to load schedule";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [slug, stageSlug, clearError, setError]);

  useEffect(() => {
    loadPage();
  }, [loadPage]);

  async function handleSchedule() {
    if (!schedule) {
      return;
    }

    if (
      hasExistingSchedule(schedule.matches) &&
      !window.confirm(SCHEDULE_OVERWRITE_CONFIRM)
    ) {
      return;
    }

    clearError();
    setScheduling(true);

    try {
      await createSchedule(slug, stageSlug, {
        numSlots: Number(numSlots),
        numTables: Number(numTables),
        maxMatchesPerSlot: Number(maxMatchesPerSlot),
      });
      await loadPage();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Failed to schedule matches");
      }
    } finally {
      setScheduling(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-slate-500">Loading schedule…</p>;
  }

  if (stages.length === 0) {
    return <NoStagesMessage tournamentSlug={slug} />;
  }

  const schedulePath = (targetStage: string) =>
    `/tournaments/${slug}/schedule/${targetStage}`;

  return (
    <div className="space-y-6">
      <PageHeader title={tournamentName || slug} />

      <StageTabs
        stages={stages}
        currentStageSlug={stageSlug}
        buildPath={schedulePath}
      />

      {noFixtures ? (
        <NoFixturesMessage
          tournamentSlug={slug}
          stageSlug={stageSlug}
          showFixturesLink={canEdit}
        />
      ) : schedule ? (
        <>
          <ScheduleMatchesTable matches={schedule.matches} />

          {canEdit && showScheduleControls(schedule.stage_type) ? (
            <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label
                    htmlFor="num-slots"
                    className="block text-sm font-medium text-slate-700"
                  >
                    Hour slots
                  </label>
                  <input
                    id="num-slots"
                    type="number"
                    min={1}
                    value={numSlots}
                    onChange={(event) => setNumSlots(event.target.value)}
                    className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label
                    htmlFor="num-tables"
                    className="block text-sm font-medium text-slate-700"
                  >
                    Tables
                  </label>
                  <input
                    id="num-tables"
                    type="number"
                    min={1}
                    value={numTables}
                    onChange={(event) => setNumTables(event.target.value)}
                    className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label
                    htmlFor="max-matches-per-slot"
                    className="block text-sm font-medium text-slate-700"
                  >
                    Max matches per table/slot
                  </label>
                  <input
                    id="max-matches-per-slot"
                    type="number"
                    min={1}
                    value={maxMatchesPerSlot}
                    onChange={(event) =>
                      setMaxMatchesPerSlot(event.target.value)
                    }
                    className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
              </div>
              <div className="mt-4">
                <Button
                  type="button"
                  disabled={scheduling}
                  onClick={handleSchedule}
                >
                  {scheduling ? "Scheduling…" : "Schedule"}
                </Button>
              </div>
            </section>
          ) : canEdit ? (
            <p className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
              {LEAGUE_ONLY_SCHEDULE_MESSAGE}
            </p>
          ) : null}
        </>
      ) : (
        <p className="text-sm text-slate-500">
          Schedule could not be loaded for this stage.
        </p>
      )}
    </div>
  );
}