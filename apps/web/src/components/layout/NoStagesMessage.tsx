import { Link } from "react-router-dom";

interface NoStagesMessageProps {
  tournamentSlug: string;
}

export function NoStagesMessage({ tournamentSlug }: NoStagesMessageProps) {
  return (
    <p className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
      Create stages first.{" "}
      <Link
        to={`/tournaments/${tournamentSlug}/stages`}
        className="font-semibold text-brand-700 hover:text-brand-800"
      >
        Go to Stages
      </Link>
    </p>
  );
}