import type { ScheduleMatch } from "../../types/schedule";
import { formatMatchDescription } from "../../utils/matches";

interface ScheduleMatchLabelProps {
  match: ScheduleMatch;
}

export function ScheduleMatchLabel({ match }: ScheduleMatchLabelProps) {
  return (
    <span className="inline-flex items-center gap-1">
      <span>{formatMatchDescription(match)}</span>
      {match.is_completed ? (
        <span
          className="font-semibold text-green-600"
          aria-label="Completed"
          title="Completed"
        >
          ✓
        </span>
      ) : null}
    </span>
  );
}