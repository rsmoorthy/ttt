import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getLeaderboard } from "../../api/leaderboard";
import { movePlayersToStage } from "../../api/move-players";
import { listMatches } from "../../api/scores";
import { listStages } from "../../api/stages";
import { getTournament } from "../../api/tournaments";
import { ApiError } from "../../api/client";
import { NoStagesMessage } from "../../components/layout/NoStagesMessage";
import { StageTabs } from "../../components/layout/StageTabs";
import { MovePlayersTable } from "../../components/move-players/MovePlayersTable";
import { Button } from "../../components/ui/Button";
import { PageHeader } from "../../components/ui/PageHeader";
import { SuccessBanner } from "../../components/ui/SuccessBanner";
import { useErrorBanner } from "../../context/error-context";
import type { LeaderboardEntry } from "../../types/leaderboard";
import type { Stage } from "../../types/stage";
import {
  buildMoveConfirmMessage,
  buildMoveSuccessMessage,
  canSubmitMove,
  stageLabel,
  targetStageOptions,
} from "../../utils/move-players";

export function MovePlayersPage() {
  const { slug = "", stage: stageSlug = "" } = useParams();
  const { setError, clearError } = useErrorBanner();
  const [tournamentName, setTournamentName] = useState("");
  const [stages, setStages] = useState<Stage[]>([]);
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [matchSummary, setMatchSummary] = useState({
    completed_matches: 0,
    total_matches: 0,
  });
  const [targetStageSlug, setTargetStageSlug] = useState("");
  const [selectedPlayers, setSelectedPlayers] = useState<Set<string>>(
    () => new Set(),
  );
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [moving, setMoving] = useState(false);

  const loadPage = useCallback(async () => {
    clearError();
    setLoading(true);

    try {
      const [tournament, stageList, leaderboard, matchState] =
        await Promise.all([
          getTournament(slug),
          listStages(slug),
          getLeaderboard(slug, stageSlug),
          listMatches(slug, stageSlug),
        ]);

      setTournamentName(tournament.name);
      setStages(stageList.stages);
      setEntries(leaderboard.entries);
      setMatchSummary(matchState.match_summary);
      setSelectedPlayers(new Set());
      setTargetStageSlug((current) => {
        const options = targetStageOptions(stageList.stages, stageSlug);
        return options.some((stage) => stage.slug === current)
          ? current
          : "";
      });
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : "Failed to load move players screen";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [slug, stageSlug, clearError, setError]);

  useEffect(() => {
    loadPage();
  }, [loadPage]);

  function togglePlayer(playerName: string) {
    setSelectedPlayers((current) => {
      const next = new Set(current);
      if (next.has(playerName)) {
        next.delete(playerName);
      } else {
        next.add(playerName);
      }
      return next;
    });
  }

  async function handleMove() {
    if (!canSubmitMove(targetStageSlug, selectedPlayers.size)) {
      return;
    }

    const targetLabel = stageLabel(stages, targetStageSlug);
    const playerNames = [...selectedPlayers];

    if (
      !window.confirm(
        buildMoveConfirmMessage(playerNames.length, targetLabel),
      )
    ) {
      return;
    }

    clearError();
    setSuccessMessage(null);
    setMoving(true);

    try {
      await movePlayersToStage(slug, stageSlug, {
        target_stage: targetStageSlug,
        players: playerNames,
      });
      setSuccessMessage(
        buildMoveSuccessMessage(playerNames.length, targetLabel),
      );
      await loadPage();
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Failed to move players";
      setError(message);
    } finally {
      setMoving(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-slate-500">Loading move players…</p>;
  }

  if (stages.length === 0) {
    return <NoStagesMessage tournamentSlug={slug} />;
  }

  const movePlayersPath = (targetStage: string) =>
    `/tournaments/${slug}/move-players/${targetStage}`;
  const targetStages = targetStageOptions(stages, stageSlug);

  return (
    <div className="space-y-6">
      <PageHeader title={tournamentName || slug} />

      {successMessage ? (
        <SuccessBanner
          message={successMessage}
          onDismiss={() => setSuccessMessage(null)}
        />
      ) : null}

      <StageTabs
        stages={stages}
        currentStageSlug={stageSlug}
        buildPath={movePlayersPath}
      />

      <MovePlayersTable
        entries={entries}
        completedMatches={matchSummary.completed_matches}
        totalMatches={matchSummary.total_matches}
        selectedPlayers={selectedPlayers}
        onTogglePlayer={togglePlayer}
      />

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
          <div>
            <label
              htmlFor="target-stage"
              className="block text-sm font-medium text-slate-700"
            >
              Target stage
            </label>
            <select
              id="target-stage"
              value={targetStageSlug}
              onChange={(event) => setTargetStageSlug(event.target.value)}
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value="">—select—</option>
              {targetStages.map((stage) => (
                <option key={stage.slug} value={stage.slug}>
                  {stage.name}
                </option>
              ))}
            </select>
          </div>
          <Button
            type="button"
            disabled={
              moving ||
              !canSubmitMove(targetStageSlug, selectedPlayers.size)
            }
            onClick={handleMove}
          >
            {moving ? "Moving…" : "Move to Stage"}
          </Button>
        </div>
      </section>
    </div>
  );
}