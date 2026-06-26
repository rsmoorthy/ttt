import { INVALID_SCORE_MESSAGE } from "../../utils/scores";
import { Button } from "../ui/Button";

interface InvalidScoreAlertProps {
  fieldId: string;
  onDismiss: () => void;
}

export function InvalidScoreAlert({
  fieldId,
  onDismiss,
}: InvalidScoreAlertProps) {
  function handleOk() {
    onDismiss();
    queueMicrotask(() => {
      document.getElementById(fieldId)?.focus();
    });
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 p-4">
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="invalid-score-title"
        aria-describedby="invalid-score-message"
        className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 shadow-xl"
      >
        <h2
          id="invalid-score-title"
          className="text-lg font-semibold text-slate-900"
        >
          Invalid score
        </h2>
        <p id="invalid-score-message" className="mt-2 text-sm text-slate-700">
          {INVALID_SCORE_MESSAGE}
        </p>
        <div className="mt-6 flex justify-end">
          <Button type="button" onClick={handleOk}>
            Ok
          </Button>
        </div>
      </div>
    </div>
  );
}