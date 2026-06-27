import type { ScheduleFilters as ScheduleFiltersState } from "../../types/schedule";
import { FILTER_EMPTY_OPTION } from "../../utils/scores";
import {
  SCHEDULE_COMPLETION_OPTIONS,
} from "../../utils/schedule";

interface ScheduleFiltersProps {
  filters: ScheduleFiltersState;
  players: string[];
  onChange: (filters: ScheduleFiltersState) => void;
}

export function ScheduleFilters({
  filters,
  players,
  onChange,
}: ScheduleFiltersProps) {
  return (
    <section className="grid gap-4 sm:grid-cols-2">
      <div>
        <label
          htmlFor="schedule-filter-player"
          className="block text-sm font-medium text-slate-700"
        >
          Player name
        </label>
        <select
          id="schedule-filter-player"
          value={filters.player}
          onChange={(event) =>
            onChange({ ...filters, player: event.target.value })
          }
          className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        >
          <option value="">{FILTER_EMPTY_OPTION}</option>
          {players.map((player) => (
            <option key={player} value={player}>
              {player}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          htmlFor="schedule-filter-completion"
          className="block text-sm font-medium text-slate-700"
        >
          Match status
        </label>
        <select
          id="schedule-filter-completion"
          value={filters.completion}
          onChange={(event) =>
            onChange({
              ...filters,
              completion: event.target.value as ScheduleFiltersState["completion"],
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