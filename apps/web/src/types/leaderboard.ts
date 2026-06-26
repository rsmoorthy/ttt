export interface LeaderboardEntry {
  rank: number;
  player_name: string;
  wins: number;
  nrr: number;
  swlr: number;
  pwlr: number;
}

export interface LeaderboardState {
  tournament: string;
  stage: string;
  entries: LeaderboardEntry[];
}