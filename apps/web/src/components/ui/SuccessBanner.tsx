interface SuccessBannerProps {
  message: string;
  onDismiss: () => void;
}

export function SuccessBanner({ message, onDismiss }: SuccessBannerProps) {
  return (
    <div
      role="status"
      className="flex items-start justify-between gap-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-900"
    >
      <p className="text-sm font-medium">{message}</p>
      <button
        type="button"
        onClick={onDismiss}
        className="shrink-0 rounded px-2 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700 hover:bg-emerald-100"
        aria-label="Dismiss success message"
      >
        Dismiss
      </button>
    </div>
  );
}