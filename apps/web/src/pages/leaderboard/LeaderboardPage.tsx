import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getLeaderboard } from "../../api/leaderboard";
import { listMatches } from "../../api/scores";
import { listStages } from "../../api/stages";
import { getTournament } from "../../api/tournaments";
import { ApiError } from "../../api/client";
import { LeaderboardTable } from "../../components/leaderboard/LeaderboardTable";
import { NoStagesMessage } from "../../components/layout/NoStagesMessage";
import { StageTabs } from "../../components/layout/StageTabs";
import { Button } from "../../components/ui/Button";
import { PageHeader } from "../../components/ui/PageHeader";
import { useErrorBanner } from "../../context/error-context";
import type { LeaderboardEntry } from "../../types/leaderboard";
import type { Stage } from "../../types/stage";

const AUTO_REFRESH_MS = 5 * 60 * 1000;

export function LeaderboardPage() {
  const { slug = "", stage: stageSlug = "" } = useParams();
  const { setError, clearError } = useErrorBanner();
  const [tournamentName, setTournamentName] = useState("");
  const [stages, setStages] = useState<Stage[]>([]);
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [matchSummary, setMatchSummary] = useState({
    completed_matches: 0,
    total_matches: 0,
  });
  const [loading, setLoading] = useState(true);

  const loadLeaderboard = useCallback(
    async (options?: { showLoading?: boolean }) => {
      const showLoading = options?.showLoading ?? true;
      clearError();
      if (showLoading) {
        setLoading(true);
      }

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
      } catch (err) {
        const message =
          err instanceof ApiError ? err.message : "Failed to load leaderboard";
        setError(message);
      } finally {
        if (showLoading) {
          setLoading(false);
        }
      }
    },
    [slug, stageSlug, clearError, setError],
  );

  useEffect(() => {
    loadLeaderboard();
  }, [loadLeaderboard]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      loadLeaderboard({ showLoading: false });
    }, AUTO_REFRESH_MS);

    return () => clearInterval(intervalId);
  }, [loadLeaderboard]);

  if (loading) {
    return <p className="text-sm text-slate-500">Loading leaderboard…</p>;
  }

  if (stages.length === 0) {
    return <NoStagesMessage tournamentSlug={slug} />;
  }

  const leaderboardPath = (targetStage: string) =>
    `/tournaments/${slug}/leaderboard/${targetStage}`;

  return (
    <div className="space-y-6">
      <PageHeader title={tournamentName || slug} />

      <StageTabs
        stages={stages}
        currentStageSlug={stageSlug}
        buildPath={leaderboardPath}
      />

      <div className="flex justify-end">
        <Button
          type="button"
          variant="secondary"
          aria-label="Refresh"
          onClick={() => loadLeaderboard()}
        >
          Refresh
        </Button>
      </div>

      <LeaderboardTable
        entries={entries}
        completedMatches={matchSummary.completed_matches}
        totalMatches={matchSummary.total_matches}
      />
    </div>
  );
}