import { REGISTRATION_ROW_COUNT } from "../../constants/registration";
import { Button } from "../ui/Button";

interface RegistrationPlayerFormProps {
  rows: string[];
  fieldErrors: Record<string, string>;
  submitting: boolean;
  onRowChange: (index: number, value: string) => void;
  onSave: () => void;
  onCancel: () => void;
}

export function RegistrationPlayerForm({
  rows,
  fieldErrors,
  submitting,
  onRowChange,
  onSave,
  onCancel,
}: RegistrationPlayerFormProps) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="space-y-3">
          {rows.map((value, index) => (
            <div key={index}>
              <label
                htmlFor={`player-row-${index}`}
                className="mb-1 block text-sm font-medium text-slate-700"
              >
                Player {index + 1}
              </label>
              <input
                id={`player-row-${index}`}
                type="text"
                value={value}
                onChange={(event) => onRowChange(index, event.target.value)}
                className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
              {fieldErrors[`players.${index}`] ? (
                <p className="mt-1 text-xs text-red-600">
                  {fieldErrors[`players.${index}`]}
                </p>
              ) : null}
              {fieldErrors[`players.${index}.player_name`] ? (
                <p className="mt-1 text-xs text-red-600">
                  {fieldErrors[`players.${index}.player_name`]}
                </p>
              ) : null}
            </div>
          ))}
        </div>
        {fieldErrors.players ? (
          <p className="mt-3 text-xs text-red-600">{fieldErrors.players}</p>
        ) : null}
      </div>

      <p className="text-xs text-slate-500">
        Up to {REGISTRATION_ROW_COUNT} players. Empty rows are ignored on save.
      </p>

      <div className="flex flex-wrap gap-3">
        <Button type="button" disabled={submitting} onClick={onSave}>
          {submitting ? "Saving…" : "Save"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={submitting}
          onClick={onCancel}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}