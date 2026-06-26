import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import type { TournamentStatus } from "../../types/tournament";
import { Button } from "../ui/Button";

export interface TournamentFormValues {
  name: string;
  slug: string;
  description: string;
  status: TournamentStatus;
}

interface TournamentFormProps {
  mode: "create" | "edit";
  values: TournamentFormValues;
  fieldErrors: Record<string, string>;
  submitting: boolean;
  onChange: (values: TournamentFormValues) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

export function TournamentForm({
  mode,
  values,
  fieldErrors,
  submitting,
  onChange,
  onSubmit,
}: TournamentFormProps) {
  function updateField<K extends keyof TournamentFormValues>(
    field: K,
    value: TournamentFormValues[K],
  ) {
    onChange({ ...values, [field]: value });
  }

  return (
    <form
      onSubmit={onSubmit}
      className="max-w-xl space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <div>
        <label
          htmlFor="tournament-name"
          className="block text-sm font-medium text-slate-700"
        >
          Name
        </label>
        <input
          id="tournament-name"
          name="name"
          type="text"
          required
          value={values.name}
          onChange={(event) => updateField("name", event.target.value)}
          className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
        {fieldErrors.name ? (
          <p className="mt-1 text-xs text-red-600">{fieldErrors.name}</p>
        ) : null}
      </div>

      <div>
        <label
          htmlFor="tournament-slug"
          className="block text-sm font-medium text-slate-700"
        >
          Slug
        </label>
        {mode === "edit" ? (
          <p
            id="tournament-slug"
            className="mt-1 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700"
          >
            {values.slug}
          </p>
        ) : (
          <input
            id="tournament-slug"
            name="slug"
            type="text"
            required
            value={values.slug}
            onChange={(event) => updateField("slug", event.target.value)}
            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        )}
        {fieldErrors.slug ? (
          <p className="mt-1 text-xs text-red-600">{fieldErrors.slug}</p>
        ) : null}
      </div>

      <div>
        <label
          htmlFor="tournament-description"
          className="block text-sm font-medium text-slate-700"
        >
          Description
        </label>
        <textarea
          id="tournament-description"
          name="description"
          rows={4}
          value={values.description}
          onChange={(event) => updateField("description", event.target.value)}
          className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
        {fieldErrors.description ? (
          <p className="mt-1 text-xs text-red-600">
            {fieldErrors.description}
          </p>
        ) : null}
      </div>

      <div>
        <label
          htmlFor="tournament-status"
          className="block text-sm font-medium text-slate-700"
        >
          Status
        </label>
        <select
          id="tournament-status"
          name="status"
          value={values.status}
          onChange={(event) =>
            updateField("status", event.target.value as TournamentStatus)
          }
          className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        >
          <option value="open">open</option>
          <option value="closed">closed</option>
        </select>
        {fieldErrors.status ? (
          <p className="mt-1 text-xs text-red-600">{fieldErrors.status}</p>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-3 pt-2">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving…" : "Save"}
        </Button>
        <Link to="/tournaments">
          <Button type="button" variant="secondary">
            Cancel
          </Button>
        </Link>
      </div>
    </form>
  );
}