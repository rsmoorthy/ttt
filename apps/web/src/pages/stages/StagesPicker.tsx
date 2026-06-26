import { TournamentPicker } from "../../components/tournaments/TournamentPicker";

export function StagesPickerPage() {
  return (
    <TournamentPicker
      title="Stages — Select tournament"
      buildPath={(slug) => `/tournaments/${slug}/stages`}
    />
  );
}