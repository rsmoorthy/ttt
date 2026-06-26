import { TournamentPicker } from "../../components/tournaments/TournamentPicker";

export function LeaderboardPickerPage() {
  return (
    <TournamentPicker
      title="Leaderboard — Select tournament"
      buildPath={(slug) => `/tournaments/${slug}/leaderboard`}
    />
  );
}