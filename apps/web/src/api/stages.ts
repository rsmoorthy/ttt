import type {
  CreateStageInput,
  Stage,
  StageDetail,
  StageListResponse,
  UpdateStageInput,
} from "../types/stage";
import { apiRequest } from "./client";

function tournamentBase(slug: string): string {
  return `/tournaments/${encodeURIComponent(slug)}`;
}

export function listStages(tournamentSlug: string): Promise<StageListResponse> {
  return apiRequest<StageListResponse>(`${tournamentBase(tournamentSlug)}/stages`);
}

export function getStage(
  tournamentSlug: string,
  stageSlug: string,
): Promise<StageDetail> {
  return apiRequest<StageDetail>(
    `${tournamentBase(tournamentSlug)}/stages/${encodeURIComponent(stageSlug)}`,
  );
}

export function createStage(
  tournamentSlug: string,
  input: CreateStageInput,
): Promise<Stage> {
  return apiRequest<Stage>(`${tournamentBase(tournamentSlug)}/stages`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateStage(
  tournamentSlug: string,
  stageSlug: string,
  input: UpdateStageInput,
): Promise<StageDetail> {
  return apiRequest<StageDetail>(
    `${tournamentBase(tournamentSlug)}/stages/${encodeURIComponent(stageSlug)}`,
    {
      method: "PUT",
      body: JSON.stringify(input),
    },
  );
}

export function deleteStage(
  tournamentSlug: string,
  stageSlug: string,
): Promise<void> {
  return apiRequest<void>(
    `${tournamentBase(tournamentSlug)}/stages/${encodeURIComponent(stageSlug)}`,
    { method: "DELETE" },
  );
}