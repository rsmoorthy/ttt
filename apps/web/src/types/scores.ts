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

export interface MatchFilterOptions {
  players: string[];
  hour_slots: number[];
  tbls: number[];
}

export interface MatchFilters {
  player: string;
  hour_slot: string;
  tbl: string;
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
    tbl: number | null;
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