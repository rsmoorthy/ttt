import { useEffect, useState } from "react";
import { hasMinimumRole } from "../../constants/navigation";
import type { UserRole } from "../../types/auth";
import type { PatchMatchInput, ScoreMatch } from "../../types/scores";
import {
  canCompleteMatch,
  canEditMatch,
  fieldErrorKey,
  GAME_FIELDS,
  matchScoreState,
  scoreFieldId,
  scoreInputClassName,
  validateMatchScores,
} from "../../utils/scores";
import { MatchCompletionSummary } from "../matches/MatchCompletionSummary";
import { Button } from "../ui/Button";
import { InfoLabel } from "../ui/InfoLabel";

const WALKOVER_WIN_HELP =
  "Set this to the Player name, to indicate a Win, when the other player did not show up";
const MATCH_OVER_HELP =
  "Click on this button for each match, after you have entered all the scores. After clicking Match Over, you cannot edit the scores";

interface ScoresMatchesTableProps {
  matches: ScoreMatch[];
  completedMatches: number;
  totalMatches: number;
  role: UserRole;
  savingSlno: number | null;
  fieldErrors: Record<string, string>;
  onFieldErrorsChange: (
    slno: number,
    errors: Record<string, string> | null,
  ) => void;
  onRowClick: (match: ScoreMatch) => void;
  onInvalidScoreCommit: (slno: number, field: string) => void;
  onPatch: (slno: number, patch: PatchMatchInput) => Promise<boolean>;
  onComplete: (slno: number) => Promise<void>;
}

type DraftValues = Record<string, string>;

function draftKey(slno: number, field: string): string {
  return fieldErrorKey(slno, field);
}

function getDraftState(
  match: ScoreMatch,
  drafts: DraftValues,
): ReturnType<typeof matchScoreState> {
  const state = matchScoreState(match);

  for (const field of GAME_FIELDS) {
    const key = draftKey(match.slno, field);
    if (drafts[key] !== undefined) {
      state[field] = drafts[key];
    }
  }

  const walkoverKey = draftKey(match.slno, "walkover_win");
  if (drafts[walkoverKey] !== undefined) {
    state.walkover_win = drafts[walkoverKey];
  }

  return state;
}

export function ScoresMatchesTable({
  matches,
  completedMatches,
  totalMatches,
  role,
  savingSlno,
  fieldErrors,
  onFieldErrorsChange,
  onRowClick,
  onInvalidScoreCommit,
  onPatch,
  onComplete,
}: ScoresMatchesTableProps) {
  const [drafts, setDrafts] = useState<DraftValues>({});

  useEffect(() => {
    setDrafts((current) => {
      const next: DraftValues = { ...current };

      for (const match of matches) {
        for (const field of [...GAME_FIELDS, "walkover_win"] as const) {
          const key = draftKey(match.slno, field);
          if (next[key] === match[field]) {
            delete next[key];
          }
        }
      }

      return next;
    });
  }, [matches]);

  function getFieldValue(match: ScoreMatch, field: (typeof GAME_FIELDS)[number]) {
    const key = draftKey(match.slno, field);
    return drafts[key] ?? match[field];
  }

  function updateDraftAndErrors(
    match: ScoreMatch,
    field: string,
    value: string,
  ) {
    const key = draftKey(match.slno, field);
    setDrafts((current) => ({ ...current, [key]: value }));

    const nextState = getDraftState(match, {
      ...drafts,
      [key]: value,
    });
    const errors = validateMatchScores(
      nextState,
      match.player1,
      match.player2,
    );
    onFieldErrorsChange(match.slno, errors);
  }

  async function handleFieldUpdate(
    match: ScoreMatch,
    patch: PatchMatchInput,
    committedField: string,
  ) {
    const mergedState = {
      ...getDraftState(match, drafts),
      ...patch,
    };
    const errors = validateMatchScores(
      mergedState,
      match.player1,
      match.player2,
    );

    if (errors) {
      onFieldErrorsChange(match.slno, errors);
      onInvalidScoreCommit(match.slno, committedField);
      return;
    }

    const saved = await onPatch(match.slno, patch);
    if (saved) {
      setDrafts((current) => {
        const next = { ...current };
        for (const field of Object.keys(patch)) {
          delete next[draftKey(match.slno, field)];
        }
        return next;
      });
    }
  }

  if (matches.length === 0) {
    return (
      <p className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
        No matches to display.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <MatchCompletionSummary
        completed={completedMatches}
        total={totalMatches}
      />
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-3 py-3 text-left font-semibold text-slate-700">
              Slno
            </th>
            <th className="px-3 py-3 text-left font-semibold text-slate-700">
              Player 1
            </th>
            <th className="px-3 py-3 text-left font-semibold text-slate-700">
              Player 2
            </th>
            {GAME_FIELDS.map((field, index) => (
              <th
                key={field}
                className="px-3 py-3 text-left font-semibold text-slate-700"
              >
                Game {index + 1}
              </th>
            ))}
            <th className="px-3 py-3 text-left font-semibold text-slate-700">
              <InfoLabel label="Walkover win" info={WALKOVER_WIN_HELP} />
            </th>
            <th className="px-3 py-3 text-left font-semibold text-slate-700">
              <InfoLabel label="Match Over" info={MATCH_OVER_HELP} />
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {matches.map((match) => {
            const editable = canEditMatch(role, match);

            return (
              <tr
                key={match.slno}
                className={
                  match.is_completed
                    ? "cursor-pointer bg-emerald-50 hover:bg-emerald-100"
                    : "cursor-pointer hover:bg-slate-50"
                }
                onClick={() => onRowClick(match)}
              >
                <td className="px-3 py-3 text-slate-600">{match.slno}</td>
                <td className="px-3 py-3 font-medium text-slate-900">
                  {match.player1}
                </td>
                <td className="px-3 py-3 font-medium text-slate-900">
                  {match.player2}
                </td>
                {GAME_FIELDS.map((field) => {
                  const errorKey = fieldErrorKey(match.slno, field);
                  const hasError = Boolean(fieldErrors[errorKey]);

                  return (
                    <td
                      key={field}
                      className="px-3 py-3"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <input
                        id={scoreFieldId(match.slno, field, "table")}
                        aria-label={`${field} for match ${match.slno}`}
                        aria-invalid={hasError}
                        type="text"
                        value={getFieldValue(match, field)}
                        readOnly={!editable}
                        className={scoreInputClassName(hasError, "w-20")}
                        onChange={(event) =>
                          updateDraftAndErrors(
                            match,
                            field,
                            event.target.value,
                          )
                        }
                        onBlur={(event) => {
                          const value = event.target.value;
                          if (value === match[field]) {
                            return;
                          }
                          void handleFieldUpdate(
                            match,
                            { [field]: value },
                            field,
                          );
                        }}
                      />
                    </td>
                  );
                })}
                <td
                  className="px-3 py-3"
                  onClick={(event) => event.stopPropagation()}
                >
                  <select
                    id={scoreFieldId(match.slno, "walkover_win", "table")}
                    aria-label={`Walkover win for match ${match.slno}`}
                    aria-invalid={Boolean(
                      fieldErrors[fieldErrorKey(match.slno, "walkover_win")],
                    )}
                    value={
                      drafts[draftKey(match.slno, "walkover_win")] ??
                      match.walkover_win
                    }
                    disabled={!editable}
                    className={scoreInputClassName(
                      Boolean(
                        fieldErrors[fieldErrorKey(match.slno, "walkover_win")],
                      ),
                    )}
                    onChange={(event) => {
                      updateDraftAndErrors(
                        match,
                        "walkover_win",
                        event.target.value,
                      );
                      void handleFieldUpdate(
                        match,
                        { walkover_win: event.target.value },
                        "walkover_win",
                      );
                    }}
                  >
                    <option value="">—</option>
                    <option value={match.player1}>{match.player1}</option>
                    <option value={match.player2}>{match.player2}</option>
                  </select>
                </td>
                <td
                  className="px-3 py-3"
                  onClick={(event) => event.stopPropagation()}
                >
                  {hasMinimumRole(role, "scorer") ? (
                    <Button
                      type="button"
                      disabled={
                        savingSlno === match.slno ||
                        !canCompleteMatch(
                          role,
                          match,
                          getDraftState(match, drafts),
                        )
                      }
                      onClick={() => onComplete(match.slno)}
                    >
                      {match.is_completed ? "Completed" : "Match Over"}
                    </Button>
                  ) : (
                    <span className="text-slate-500">
                      {match.is_completed ? "Completed" : "—"}
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
        </table>
      </div>
    </div>
  );
}