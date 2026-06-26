import type { RegisteredPlayer } from "./registration";
import type { StageType } from "./stage";

export interface FixtureMatchRow {
  slno: number;
  player1: string;
  player2: string;
}

export interface FixtureSummary {
  total_matches: number;
  matches_per_player: number;
}

export interface FixturesState {
  tournament: string;
  stage: string;
  stage_type: StageType;
  players: RegisteredPlayer[];
  player_source: "registration" | "stages_players";
  has_fixtures: boolean;
  groups: Record<string, string[]>;
  matches: FixtureMatchRow[];
  summary: FixtureSummary | null;
}

export interface CreateFixturesInput {
  approx_total_matches?: number;
}

export interface CreateFixturesResponse {
  tournament: string;
  stage: string;
  stage_type?: StageType;
  total_matches: number;
  matches_per_player: number;
  groups?: Record<string, string[]>;
  matches: FixtureMatchRow[];
}