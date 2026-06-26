import { TournamentPicker } from "../../components/tournaments/TournamentPicker";

export function ScoresPickerPage() {
  return (
    <TournamentPicker
      title="Scores — Select tournament"
      buildPath={(slug) => `/tournaments/${slug}/scores`}
    />
  );
}