import type { TournamentStatus } from "../../types/tournament";

const STATUS_STYLES: Record<TournamentStatus, string> = {
  open: "bg-emerald-100 text-emerald-800 ring-emerald-200",
  closed: "bg-slate-100 text-slate-700 ring-slate-200",
};

interface StatusBadgeProps {
  status: TournamentStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ring-1 ring-inset ${STATUS_STYLES[status]}`}
    >
      {status}
    </span>
  );
}