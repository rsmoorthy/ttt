import { TournamentPicker } from "../../components/tournaments/TournamentPicker";

export function RegistrationPickerPage() {
  return (
    <TournamentPicker
      title="Registration — Select tournament"
      buildPath={(slug) => `/tournaments/${slug}/registration`}
    />
  );
}