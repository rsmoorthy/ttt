import { TournamentPicker } from "../../components/tournaments/TournamentPicker";

export function FixturesPickerPage() {
  return (
    <TournamentPicker
      title="Fixtures — Select tournament"
      buildPath={(slug) => `/tournaments/${slug}/fixtures`}
    />
  );
}