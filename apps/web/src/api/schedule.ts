import type {
  CreateScheduleInput,
  CreateScheduleResponse,
  ScheduleState,
} from "../types/schedule";
import { apiRequest } from "./client";

function schedulePath(tournamentSlug: string, stageSlug: string): string {
  return `/tournaments/${encodeURIComponent(tournamentSlug)}/stages/${encodeURIComponent(stageSlug)}/schedule`;
}

export function getSchedule(
  tournamentSlug: string,
  stageSlug: string,
): Promise<ScheduleState> {
  return apiRequest<ScheduleState>(schedulePath(tournamentSlug, stageSlug));
}

export function createSchedule(
  tournamentSlug: string,
  stageSlug: string,
  input: CreateScheduleInput,
): Promise<CreateScheduleResponse> {
  return apiRequest<CreateScheduleResponse>(schedulePath(tournamentSlug, stageSlug), {
    method: "POST",
    body: JSON.stringify(input),
  });
}