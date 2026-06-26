import { TournamentPicker } from "../../components/tournaments/TournamentPicker";

export function MovePlayersPickerPage() {
  return (
    <TournamentPicker
      title="Move to Stage — Select tournament"
      buildPath={(slug) => `/tournaments/${slug}/move-players`}
    />
  );
}