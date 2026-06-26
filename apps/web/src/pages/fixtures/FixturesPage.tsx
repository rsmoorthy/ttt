import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { createFixtures, getFixtures } from "../../api/fixtures";
import { listStages } from "../../api/stages";
import { getTournament } from "../../api/tournaments";
import { ApiError } from "../../api/client";
import { FixtureGroups } from "../../components/fixtures/FixtureGroups";
import { FixtureMatchesTable } from "../../components/fixtures/FixtureMatchesTable";
import { NoStagesMessage } from "../../components/layout/NoStagesMessage";
import { StageTabs } from "../../components/layout/StageTabs";
import { Button } from "../../components/ui/Button";
import { PageHeader } from "../../components/ui/PageHeader";
import { useErrorBanner } from "../../context/error-context";
import type { FixturesState } from "../../types/fixtures";
import type { Stage } from "../../types/stage";
import {
  FIXTURE_REGENERATE_CONFIRM,
  showApproxTotalMatches,
} from "../../utils/fixtures";

export function FixturesPage() {
  const { slug = "", stage: stageSlug = "" } = useParams();
  const { setError, clearError } = useErrorBanner();
  const [tournamentName, setTournamentName] = useState("");
  const [stages, setStages] = useState<Stage[]>([]);
  const [fixtures, setFixtures] = useState<FixturesState | null>(null);
  const [approxTotalMatches, setApproxTotalMatches] = useState("70");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const loadPage = useCallback(async () => {
    clearError();
    setLoading(true);

    try {
      const [tournament, stageList, fixtureState] = await Promise.all([
        getTournament(slug),
        listStages(slug),
        getFixtures(slug, stageSlug),
      ]);

      setTournamentName(tournament.name);
      setStages(stageList.stages);
      setFixtures(fixtureState);
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Failed to load fixtures";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [slug, stageSlug, clearError, setError]);

  useEffect(() => {
    loadPage();
  }, [loadPage]);

  async function handleCreateFixtures() {
    if (!fixtures) {
      return;
    }

    if (fixtures.has_fixtures && !window.confirm(FIXTURE_REGENERATE_CONFIRM)) {
      return;
    }

    clearError();
    setCreating(true);

    try {
      const body = showApproxTotalMatches(fixtures.stage_type)
        ? { approx_total_matches: Number(approxTotalMatches) }
        : {};

      await createFixtures(slug, stageSlug, body);
      await loadPage();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Failed to create fixtures");
      }
    } finally {
      setCreating(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-slate-500">Loading fixtures…</p>;
  }

  if (stages.length === 0) {
    return <NoStagesMessage tournamentSlug={slug} />;
  }

  if (!fixtures) {
    return (
      <p className="text-sm text-slate-500">
        Fixtures could not be loaded for this stage.
      </p>
    );
  }

  const fixturesPath = (targetStage: string) =>
    `/tournaments/${slug}/fixtures/${targetStage}`;

  return (
    <div className="space-y-6">
      <PageHeader title={tournamentName || slug} />

      <StageTabs
        stages={stages}
        currentStageSlug={stageSlug}
        buildPath={fixturesPath}
      />

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
          Players
        </h3>
        {fixtures.players.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">No players available.</p>
        ) : (
          <ul className="mt-2 list-inside list-disc text-sm text-slate-700">
            {fixtures.players.map((player) => (
              <li key={`${player.sort_order}-${player.player_name}`}>
                {player.player_name}
              </li>
            ))}
          </ul>
        )}
        <p className="mt-2 text-xs text-slate-500">
          Source: {fixtures.player_source}
        </p>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          {showApproxTotalMatches(fixtures.stage_type) ? (
            <div className="flex-1">
              <label
                htmlFor="approx-total-matches"
                className="block text-sm font-medium text-slate-700"
              >
                Approx total matches
              </label>
              <input
                id="approx-total-matches"
                type="number"
                min={1}
                value={approxTotalMatches}
                onChange={(event) => setApproxTotalMatches(event.target.value)}
                className="mt-1 block w-full max-w-xs rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
          ) : null}
          <Button
            type="button"
            disabled={creating || fixtures.players.length === 0}
            onClick={handleCreateFixtures}
          >
            {creating ? "Creating…" : "Create Fixtures"}
          </Button>
        </div>
      </section>

      {fixtures.summary ? (
        <p className="text-sm text-slate-700">
          <span className="font-semibold">Summary:</span>{" "}
          {fixtures.summary.total_matches} matches,{" "}
          {fixtures.summary.matches_per_player} per player
        </p>
      ) : null}

      {fixtures.has_fixtures ? (
        <>
          <FixtureGroups groups={fixtures.groups} />
          <FixtureMatchesTable matches={fixtures.matches} />
        </>
      ) : null}
    </div>
  );
}