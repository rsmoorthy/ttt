import { TournamentPicker } from "../../components/tournaments/TournamentPicker";

export function SchedulePickerPage() {
  return (
    <TournamentPicker
      title="Schedule — Select tournament"
      buildPath={(slug) => `/tournaments/${slug}/schedule`}
    />
  );
}