import type {
  MovePlayersInput,
  MovePlayersResponse,
} from "../types/move-players";
import { apiRequest } from "./client";

function movePlayersPath(
  tournamentSlug: string,
  sourceStageSlug: string,
): string {
  return `/tournaments/${encodeURIComponent(tournamentSlug)}/stages/${encodeURIComponent(sourceStageSlug)}/move-players`;
}

export function movePlayersToStage(
  tournamentSlug: string,
  sourceStageSlug: string,
  input: MovePlayersInput,
): Promise<MovePlayersResponse> {
  return apiRequest<MovePlayersResponse>(
    movePlayersPath(tournamentSlug, sourceStageSlug),
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
}