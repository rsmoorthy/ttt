import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { completeMatch, listMatches, patchMatch } from "../../api/scores";
import { listStages } from "../../api/stages";
import { getTournament } from "../../api/tournaments";
import { ApiError } from "../../api/client";
import { NoStagesMessage } from "../../components/layout/NoStagesMessage";
import { StageTabs } from "../../components/layout/StageTabs";
import { InvalidScoreAlert } from "../../components/scores/InvalidScoreAlert";
import { ScoreEditModal } from "../../components/scores/ScoreEditModal";
import { ScoresFilters } from "../../components/scores/ScoresFilters";
import { ScoresMatchesTable } from "../../components/scores/ScoresMatchesTable";
import { Button } from "../../components/ui/Button";
import { PageHeader } from "../../components/ui/PageHeader";
import { useAuth } from "../../context/auth-context";
import { useErrorBanner } from "../../context/error-context";
import type { MatchFilters, PatchMatchInput, ScoreMatch } from "../../types/scores";
import type { Stage } from "../../types/stage";
import {
  fieldErrorKey,
  invalidScoreAlertMessage,
  mergeMatchPatch,
  scoreFieldId,
  validateMatchScores,
} from "../../utils/scores";

const EMPTY_FILTERS: MatchFilters = {
  player: "",
  hour_slot: "",
  completion: "",
};

type SaveStatus = "idle" | "saving" | "saved";

interface InvalidScoreTarget {
  slno: number;
  field: string;
  context: "table" | "modal";
}

export function ScoresPage() {
  const { slug = "", stage: stageSlug = "" } = useParams();
  const { user } = useAuth();
  const { setError, clearError } = useErrorBanner();
  const [tournamentName, setTournamentName] = useState("");
  const [stages, setStages] = useState<Stage[]>([]);
  const [matches, setMatches] = useState<ScoreMatch[]>([]);
  const [matchSummary, setMatchSummary] = useState({
    completed_matches: 0,
    total_matches: 0,
  });
  const [filterOptions, setFilterOptions] = useState({
    players: [] as string[],
    hour_slots: [] as number[],
  });
  const [filters, setFilters] = useState<MatchFilters>(EMPTY_FILTERS);
  const [selectedMatch, setSelectedMatch] = useState<ScoreMatch | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingSlno, setSavingSlno] = useState<number | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [invalidScoreTarget, setInvalidScoreTarget] =
    useState<InvalidScoreTarget | null>(null);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (savedTimerRef.current) {
        clearTimeout(savedTimerRef.current);
      }
    };
  }, []);

  const loadMatches = useCallback(async () => {
    clearError();
    setLoading(true);

    try {
      const [tournament, stageList, matchState] = await Promise.all([
        getTournament(slug),
        listStages(slug),
        listMatches(slug, stageSlug, filters),
      ]);

      setTournamentName(tournament.name);
      setStages(stageList.stages);
      setMatches(matchState.matches);
      setFilterOptions(matchState.filter_options);
      setMatchSummary(matchState.match_summary);
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Failed to load scores";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [slug, stageSlug, filters, clearError, setError]);

  useEffect(() => {
    loadMatches();
  }, [loadMatches]);

  function setFieldErrorsForMatch(
    slno: number,
    errors: Record<string, string> | null,
  ) {
    setFieldErrors((current) => {
      const next = { ...current };
      for (const key of Object.keys(next)) {
        if (key.startsWith(`${slno}:`)) {
          delete next[key];
        }
      }

      if (errors) {
        for (const [field, message] of Object.entries(errors)) {
          next[fieldErrorKey(slno, field)] = message;
        }
      }

      return next;
    });
  }

  function showInvalidScoreAlert(slno: number, field: string) {
    const context: "table" | "modal" =
      selectedMatch?.slno === slno ? "modal" : "table";
    setInvalidScoreTarget({ slno, field, context });
  }

  function markSaved() {
    setSaveStatus("saved");
    if (savedTimerRef.current) {
      clearTimeout(savedTimerRef.current);
    }
    savedTimerRef.current = setTimeout(() => {
      setSaveStatus("idle");
    }, 5000);
  }

  async function handlePatch(
    slno: number,
    patch: PatchMatchInput,
  ): Promise<boolean> {
    const match = matches.find((item) => item.slno === slno);
    if (!match) {
      return false;
    }

    const nextState = mergeMatchPatch(match, patch);
    const clientErrors = validateMatchScores(
      nextState,
      match.player1,
      match.player2,
    );
    if (clientErrors) {
      setFieldErrorsForMatch(slno, clientErrors);
      return false;
    }

    clearError();
    setSaveStatus("saving");
    setSavingSlno(slno);

    try {
      const updated = await patchMatch(slug, stageSlug, slno, patch);
      setMatches((current) =>
        current.map((item) => (item.slno === slno ? updated : item)),
      );
      setSelectedMatch((current) =>
        current?.slno === slno ? updated : current,
      );
      setFieldErrorsForMatch(slno, null);
      markSaved();
      return true;
    } catch (err) {
      setSaveStatus("idle");
      if (err instanceof ApiError) {
        if (err.fields) {
          setFieldErrorsForMatch(slno, err.fields);
          const firstField = Object.keys(err.fields)[0];
          if (firstField) {
            showInvalidScoreAlert(slno, firstField);
          }
        } else {
          setError(err.message);
        }
      } else {
        setError("Failed to save score");
      }
      return false;
    } finally {
      setSavingSlno(null);
    }
  }

  async function handleComplete(slno: number) {
    clearError();
    setSaveStatus("saving");
    setSavingSlno(slno);

    try {
      const updated = await completeMatch(slug, stageSlug, slno);
      setMatches((current) =>
        current.map((item) => (item.slno === slno ? updated : item)),
      );
      setSelectedMatch((current) =>
        current?.slno === slno ? updated : current,
      );
      markSaved();
    } catch (err) {
      setSaveStatus("idle");
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Failed to complete match");
      }
    } finally {
      setSavingSlno(null);
    }
  }

  if (loading) {
    return <p className="text-sm text-slate-500">Loading scores…</p>;
  }

  if (stages.length === 0) {
    return <NoStagesMessage tournamentSlug={slug} />;
  }

  const scoresPath = (targetStage: string) =>
    `/tournaments/${slug}/scores/${targetStage}`;

  return (
    <div className="space-y-6">
      <PageHeader title={tournamentName || slug} />

      <StageTabs
        stages={stages}
        currentStageSlug={stageSlug}
        buildPath={scoresPath}
      />

      <div className="space-y-4">
        <div className="flex justify-end gap-2">
          {saveStatus !== "idle" ? (
            <span
              aria-live="polite"
              className="inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm"
            >
              {saveStatus === "saving" ? "Saving…" : "Saved"}
            </span>
          ) : null}
          <Button
            type="button"
            variant="secondary"
            aria-label="Refresh"
            onClick={() => loadMatches()}
          >
            Refresh
          </Button>
        </div>
        <ScoresFilters
          filters={filters}
          options={filterOptions}
          onChange={setFilters}
        />
      </div>

      <ScoresMatchesTable
        matches={matches}
        completedMatches={matchSummary.completed_matches}
        totalMatches={matchSummary.total_matches}
        role={user?.role ?? "guest"}
        savingSlno={savingSlno}
        fieldErrors={fieldErrors}
        onFieldErrorsChange={setFieldErrorsForMatch}
        onRowClick={setSelectedMatch}
        onInvalidScoreCommit={showInvalidScoreAlert}
        onPatch={handlePatch}
        onComplete={handleComplete}
      />

      {selectedMatch && user ? (
        <ScoreEditModal
          match={selectedMatch}
          role={user.role}
          saving={savingSlno === selectedMatch.slno}
          fieldErrors={fieldErrors}
          onFieldErrorsChange={setFieldErrorsForMatch}
          onInvalidScoreCommit={showInvalidScoreAlert}
          onClose={() => setSelectedMatch(null)}
          onSave={handlePatch}
          onComplete={handleComplete}
        />
      ) : null}

      {invalidScoreTarget ? (
        <InvalidScoreAlert
          fieldId={scoreFieldId(
            invalidScoreTarget.slno,
            invalidScoreTarget.field,
            invalidScoreTarget.context,
          )}
          message={invalidScoreAlertMessage(
            invalidScoreTarget.slno,
            invalidScoreTarget.field,
            fieldErrors,
          )}
          onDismiss={() => setInvalidScoreTarget(null)}
        />
      ) : null}
    </div>
  );
}