export interface RegisteredPlayer {
  player_name: string;
  sort_order: number;
}

export interface RegistrationResponse {
  tournament: string;
  players: RegisteredPlayer[];
}

export interface ReplaceRegistrationInput {
  players: string[];
}