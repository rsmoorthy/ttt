import type {
  CreateTournamentInput,
  Tournament,
  TournamentListResponse,
  UpdateTournamentInput,
} from "../types/tournament";
import { apiRequest } from "./client";

export function listTournaments(): Promise<TournamentListResponse> {
  return apiRequest<TournamentListResponse>("/tournaments");
}

export function getTournament(slug: string): Promise<Tournament> {
  return apiRequest<Tournament>(`/tournaments/${encodeURIComponent(slug)}`);
}

export function createTournament(
  input: CreateTournamentInput,
): Promise<Tournament> {
  return apiRequest<Tournament>("/tournaments", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateTournament(
  slug: string,
  input: UpdateTournamentInput,
): Promise<Tournament> {
  return apiRequest<Tournament>(`/tournaments/${encodeURIComponent(slug)}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export function deleteTournament(slug: string): Promise<void> {
  return apiRequest<void>(`/tournaments/${encodeURIComponent(slug)}`, {
    method: "DELETE",
  });
}