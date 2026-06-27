import type { StageType } from "./stage";

export interface ScheduleMatch {
  slno: number;
  player1: string;
  player2: string;
  tbl: number | null;
  hour_slot: number | null;
  is_completed: boolean;
}

export interface MatchSummary {
  completed_matches: number;
  total_matches: number;
}

export interface ScheduleState {
  tournament: string;
  stage: string;
  stage_type: StageType;
  has_fixtures: boolean;
  matches: ScheduleMatch[];
  match_summary: MatchSummary;
}

export interface CreateScheduleInput {
  numSlots: number;
  numTables: number;
  maxMatchesPerSlot: number;
}

export type ScheduleCompletionFilter = "" | "pending" | "completed";

export interface ScheduleFilters {
  player: string;
  completion: ScheduleCompletionFilter;
}

export interface CreateScheduleResponse {
  tournament: string;
  stage: string;
  matches: Array<{
    player1: string;
    player2: string;
    hour_slot: number;
    tbl: number;
  }>;
}