import type { RegisteredPlayer } from "./registration";

export interface MovePlayersInput {
  target_stage: string;
  players: string[];
}

export interface MovePlayersResponse {
  tournament: string;
  source_stage: string;
  target_stage: string;
  players: RegisteredPlayer[];
}