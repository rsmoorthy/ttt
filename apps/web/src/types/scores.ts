export interface ScoreMatch {
  slno: number;
  player1: string;
  player2: string;
  tbl: number | null;
  hour_slot: number | null;
  game1: string;
  game2: string;
  game3: string;
  game4: string;
  game5: string;
  walkover_win: string;
  is_completed: boolean;
}

export type ScoreCompletionFilter = "" | "pending" | "completed";

export interface MatchFilterOptions {
  players: string[];
  hour_slots: number[];
}

export interface MatchFilters {
  player: string;
  hour_slot: string;
  completion: ScoreCompletionFilter;
}

export interface MatchSummary {
  completed_matches: number;
  total_matches: number;
}

export interface MatchesState {
  tournament: string;
  stage: string;
  filters: {
    player: string | null;
    hour_slot: number | null;
    completion: "pending" | "completed" | null;
  };
  matches: ScoreMatch[];
  filter_options: MatchFilterOptions;
  match_summary: MatchSummary;
}

export interface PatchMatchInput {
  game1?: string;
  game2?: string;
  game3?: string;
  game4?: string;
  game5?: string;
  walkover_win?: string;
}