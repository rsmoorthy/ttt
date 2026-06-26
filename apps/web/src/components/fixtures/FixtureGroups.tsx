interface FixtureGroupsProps {
  groups: Record<string, string[]>;
}

export function FixtureGroups({ groups }: FixtureGroupsProps) {
  const entries = Object.entries(groups);

  if (entries.length === 0) {
    return null;
  }

  return (
    <section className="space-y-3">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
        Groups
      </h3>
      <div className="grid gap-3 sm:grid-cols-2">
        {entries.map(([groupName, players]) => (
          <div
            key={groupName}
            className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
          >
            <h4 className="font-semibold text-slate-900">Group {groupName}</h4>
            <ul className="mt-2 list-inside list-disc text-sm text-slate-700">
              {players.map((player) => (
                <li key={player}>{player}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}