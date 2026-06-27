import { useEffect, useState } from "react";
import { hasMinimumRole } from "../../constants/navigation";
import type { UserRole } from "../../types/auth";
import type { PatchMatchInput, ScoreMatch } from "../../types/scores";
import {
  canCompleteMatch,
  canEditMatch,
  fieldErrorKey,
  GAME_FIELDS,
  getCompletedMatchWinner,
  matchScoreState,
  mergeMatchPatch,
  scoreFieldId,
  scoreInputClassName,
  validateMatchScores,
} from "../../utils/scores";
import { Button } from "../ui/Button";
import { InfoLabel } from "../ui/InfoLabel";
import { PlayerNameWithWinner } from "./PlayerNameWithWinner";

const WALKOVER_WIN_HELP =
  "Set this to the Player name, to indicate a Win, when the other player did not show up";

interface ScoreEditModalProps {
  match: ScoreMatch;
  role: UserRole;
  saving: boolean;
  fieldErrors: Record<string, string>;
  onFieldErrorsChange: (
    slno: number,
    errors: Record<string, string> | null,
  ) => void;
  onInvalidScoreCommit: (slno: number, field: string) => void;
  onClose: () => void;
  onSave: (slno: number, patch: PatchMatchInput) => Promise<boolean>;
  onComplete: (slno: number) => Promise<void>;
}

export function ScoreEditModal({
  match,
  role,
  saving,
  fieldErrors,
  onFieldErrorsChange,
  onInvalidScoreCommit,
  onClose,
  onSave,
  onComplete,
}: ScoreEditModalProps) {
  const editable = canEditMatch(role, match);
  const [draft, setDraft] = useState(matchScoreState(match));
  const winner = match.is_completed
    ? getCompletedMatchWinner(draft, match.player1, match.player2)
    : null;

  useEffect(() => {
    setDraft(matchScoreState(match));
  }, [match]);

  function updateDraftAndErrors(
    nextDraft: ReturnType<typeof matchScoreState>,
  ) {
    setDraft(nextDraft);
    const errors = validateMatchScores(
      nextDraft,
      match.player1,
      match.player2,
    );
    onFieldErrorsChange(match.slno, errors);
  }

  async function persistPatch(
    patch: PatchMatchInput,
    committedField: string,
  ) {
    const nextState = mergeMatchPatch(
      { ...match, ...draft },
      patch,
    );
    const errors = validateMatchScores(
      nextState,
      match.player1,
      match.player2,
    );
    if (errors) {
      onFieldErrorsChange(match.slno, errors);
      onInvalidScoreCommit(match.slno, committedField);
      return;
    }

    const saved = await onSave(match.slno, patch);
    if (saved) {
      onFieldErrorsChange(match.slno, null);
    }
  }

  async function handleGameBlur(field: (typeof GAME_FIELDS)[number]) {
    if (!editable || draft[field] === match[field]) {
      return;
    }

    await persistPatch({ [field]: draft[field] }, field);
  }

  async function handleWalkoverChange(value: string) {
    const nextDraft = { ...draft, walkover_win: value };
    updateDraftAndErrors(nextDraft);

    if (!editable) {
      return;
    }

    await persistPatch({ walkover_win: value }, "walkover_win");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="score-edit-title"
        className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2
              id="score-edit-title"
              className="text-lg font-semibold text-slate-900"
            >
              Match {match.slno}
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Hour slot {match.hour_slot ?? "—"} · Table {match.tbl ?? "—"}
            </p>
            <p className="mt-1 text-sm font-medium text-slate-800">
              <PlayerNameWithWinner
                name={match.player1}
                isWinner={winner === match.player1}
              />{" "}
              vs{" "}
              <PlayerNameWithWinner
                name={match.player2}
                isWinner={winner === match.player2}
              />
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-2 py-1 text-sm font-medium text-slate-600 hover:bg-slate-100"
          >
            Close
          </button>
        </div>

        <div className="mt-6 space-y-4">
          <p className="text-sm font-semibold uppercase tracking-wider text-slate-500">
            <PlayerNameWithWinner
              name={match.player1}
              isWinner={winner === match.player1}
            />{" "}
            vs{" "}
            <PlayerNameWithWinner
              name={match.player2}
              isWinner={winner === match.player2}
            />
          </p>

          {GAME_FIELDS.map((field, index) => {
            const errorKey = fieldErrorKey(match.slno, field);
            const hasError = Boolean(fieldErrors[errorKey]);

            return (
              <div key={field}>
                <label
                  htmlFor={scoreFieldId(match.slno, field, "modal")}
                  className="block text-sm font-medium text-slate-700"
                >
                  Game {index + 1}
                </label>
                <input
                  id={scoreFieldId(match.slno, field, "modal")}
                  type="text"
                  value={draft[field]}
                  readOnly={!editable}
                  aria-invalid={hasError}
                  onChange={(event) => {
                    const nextDraft = {
                      ...draft,
                      [field]: event.target.value,
                    };
                    updateDraftAndErrors(nextDraft);
                  }}
                  onBlur={() => handleGameBlur(field)}
                  className={`mt-1 block w-full disabled:bg-slate-50 ${scoreInputClassName(hasError)}`}
                />
                {fieldErrors[errorKey] ? (
                  <p className="mt-1 text-xs text-red-600">
                    {fieldErrors[errorKey]}
                  </p>
                ) : null}
              </div>
            );
          })}

          <div>
            <label
              htmlFor={scoreFieldId(match.slno, "walkover_win", "modal")}
              className="block text-sm font-medium text-slate-700"
            >
              <InfoLabel label="Walkover win" info={WALKOVER_WIN_HELP} />
            </label>
            <select
              id={scoreFieldId(match.slno, "walkover_win", "modal")}
              value={draft.walkover_win}
              disabled={!editable}
              aria-invalid={Boolean(
                fieldErrors[fieldErrorKey(match.slno, "walkover_win")],
              )}
              onChange={(event) => handleWalkoverChange(event.target.value)}
              className={`mt-1 block w-full disabled:bg-slate-50 ${scoreInputClassName(
                Boolean(
                  fieldErrors[fieldErrorKey(match.slno, "walkover_win")],
                ),
              )}`}
            >
              <option value="">—</option>
              <option value={match.player1}>{match.player1}</option>
              <option value={match.player2}>{match.player2}</option>
            </select>
            {fieldErrors[fieldErrorKey(match.slno, "walkover_win")] ? (
              <p className="mt-1 text-xs text-red-600">
                {fieldErrors[fieldErrorKey(match.slno, "walkover_win")]}
              </p>
            ) : null}
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>
            Close
          </Button>
          {hasMinimumRole(role, "scorer") ? (
            <Button
              type="button"
              variant={match.is_completed ? "completed" : "primary"}
              disabled={saving || !canCompleteMatch(role, match, draft)}
              onClick={() => onComplete(match.slno)}
            >
              {match.is_completed ? "Completed" : "Match Over"}
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}