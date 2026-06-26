import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { STAGE_TYPE_LABELS, STAGE_TYPES } from "../../constants/stage-types";
import type { StageType } from "../../types/stage";
import { Button } from "../ui/Button";

export interface StageFormValues {
  name: string;
  slug: string;
  description: string;
  stage_type: StageType;
  is_completed: boolean;
}

interface StageFormProps {
  mode: "create" | "edit";
  tournamentSlug: string;
  values: StageFormValues;
  fieldErrors: Record<string, string>;
  submitting: boolean;
  onChange: (values: StageFormValues) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

export function StageForm({
  mode,
  tournamentSlug,
  values,
  fieldErrors,
  submitting,
  onChange,
  onSubmit,
}: StageFormProps) {
  function updateField<K extends keyof StageFormValues>(
    field: K,
    value: StageFormValues[K],
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
          htmlFor="stage-name"
          className="block text-sm font-medium text-slate-700"
        >
          Name
        </label>
        <input
          id="stage-name"
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
          htmlFor="stage-slug"
          className="block text-sm font-medium text-slate-700"
        >
          Slug
        </label>
        {mode === "edit" ? (
          <p
            id="stage-slug"
            className="mt-1 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700"
          >
            {values.slug}
          </p>
        ) : (
          <input
            id="stage-slug"
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
          htmlFor="stage-description"
          className="block text-sm font-medium text-slate-700"
        >
          Description
        </label>
        <textarea
          id="stage-description"
          name="description"
          rows={4}
          value={values.description}
          onChange={(event) => updateField("description", event.target.value)}
          className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
        {fieldErrors.description ? (
          <p className="mt-1 text-xs text-red-600">{fieldErrors.description}</p>
        ) : null}
      </div>

      <div>
        <label
          htmlFor="stage-type"
          className="block text-sm font-medium text-slate-700"
        >
          Stage type
        </label>
        <select
          id="stage-type"
          name="stage_type"
          value={values.stage_type}
          onChange={(event) =>
            updateField("stage_type", event.target.value as StageType)
          }
          className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        >
          {STAGE_TYPES.map((stageType) => (
            <option key={stageType} value={stageType}>
              {STAGE_TYPE_LABELS[stageType]}
            </option>
          ))}
        </select>
        {fieldErrors.stage_type ? (
          <p className="mt-1 text-xs text-red-600">{fieldErrors.stage_type}</p>
        ) : null}
      </div>

      <div className="flex items-center gap-2">
        <input
          id="stage-completed"
          name="is_completed"
          type="checkbox"
          checked={values.is_completed}
          onChange={(event) =>
            updateField("is_completed", event.target.checked)
          }
          className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
        />
        <label htmlFor="stage-completed" className="text-sm text-slate-700">
          Is completed
        </label>
      </div>
      {fieldErrors.is_completed ? (
        <p className="text-xs text-red-600">{fieldErrors.is_completed}</p>
      ) : null}

      <div className="flex flex-wrap gap-3 pt-2">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving…" : "Save"}
        </Button>
        <Link to={`/tournaments/${tournamentSlug}/stages`}>
          <Button type="button" variant="secondary">
            Cancel
          </Button>
        </Link>
      </div>
    </form>
  );
}