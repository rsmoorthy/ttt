import { Link } from "react-router-dom";

interface NoFixturesMessageProps {
  tournamentSlug: string;
  stageSlug: string;
  showFixturesLink?: boolean;
}

export function NoFixturesMessage({
  tournamentSlug,
  stageSlug,
  showFixturesLink = true,
}: NoFixturesMessageProps) {
  return (
    <p className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
      Create fixtures first.
      {showFixturesLink ? (
        <>
          {" "}
          <Link
            to={`/tournaments/${tournamentSlug}/fixtures/${stageSlug}`}
            className="font-semibold text-brand-700 hover:text-brand-800"
          >
            Go to Fixtures
          </Link>
        </>
      ) : null}
    </p>
  );
}