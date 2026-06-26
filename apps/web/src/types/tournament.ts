export type TournamentStatus = "open" | "closed";

export interface Tournament {
  slug: string;
  name: string;
  description: string;
  status: TournamentStatus;
}

export interface TournamentListResponse {
  tournaments: Tournament[];
}

export interface CreateTournamentInput {
  name: string;
  slug: string;
  description?: string;
  status?: TournamentStatus;
}

export interface UpdateTournamentInput {
  name?: string;
  description?: string;
  status?: TournamentStatus;
}