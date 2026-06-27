import type { MatchFilterOptions, MatchFilters } from "../../types/scores";
import { FILTER_EMPTY_OPTION } from "../../utils/scores";
import { SCHEDULE_COMPLETION_OPTIONS } from "../../utils/schedule";

interface ScoresFiltersProps {
  filters: MatchFilters;
  options: MatchFilterOptions;
  onChange: (filters: MatchFilters) => void;
}

function FilterSelect({
  id,
  label,
  value,
  options,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  options: Array<string | number>;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-slate-700">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
      >
        <option value="">{FILTER_EMPTY_OPTION}</option>
        {options.map((option) => (
          <option key={option} value={String(option)}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

export function ScoresFilters({
  filters,
  options,
  onChange,
}: ScoresFiltersProps) {
  return (
    <section className="grid gap-4 sm:grid-cols-3">
      <FilterSelect
        id="scores-filter-player"
        label="Player"
        value={filters.player}
        options={options.players}
        onChange={(player) => onChange({ ...filters, player })}
      />
      <FilterSelect
        id="scores-filter-hour-slot"
        label="Hour slot"
        value={filters.hour_slot}
        options={options.hour_slots}
        onChange={(hour_slot) => onChange({ ...filters, hour_slot })}
      />
      <div>
        <label
          htmlFor="scores-filter-completion"
          className="block text-sm font-medium text-slate-700"
        >
          Match status
        </label>
        <select
          id="scores-filter-completion"
          value={filters.completion}
          onChange={(event) =>
            onChange({
              ...filters,
              completion: event.target.value as MatchFilters["completion"],
            })
          }
          className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        >
          <option value="">{FILTER_EMPTY_OPTION}</option>
          {SCHEDULE_COMPLETION_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </section>
  );
}