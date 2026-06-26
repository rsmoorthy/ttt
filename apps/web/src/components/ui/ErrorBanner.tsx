interface ErrorBannerProps {
  message: string;
  onDismiss: () => void;
}

export function ErrorBanner({ message, onDismiss }: ErrorBannerProps) {
  return (
    <div
      role="alert"
      className="flex items-start justify-between gap-4 border-b border-red-200 bg-red-50 px-4 py-3 text-red-900"
    >
      <p className="text-sm font-medium">{message}</p>
      <button
        type="button"
        onClick={onDismiss}
        className="shrink-0 rounded px-2 py-1 text-xs font-semibold uppercase tracking-wide text-red-700 hover:bg-red-100"
        aria-label="Dismiss error"
      >
        Dismiss
      </button>
    </div>
  );
}