interface MatchCompletionSummaryProps {
  completed: number;
  total: number;
}

export function MatchCompletionSummary({
  completed,
  total,
}: MatchCompletionSummaryProps) {
  if (total === 0) {
    return null;
  }

  return (
    <p className="w-1/2 mx-auto rounded-[10px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-center text-[1.225rem] font-medium leading-tight text-slate-700">
      Total matches completed: {completed}/{total}
    </p>
  );
}
