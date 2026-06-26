import type {
  CreateFixturesInput,
  CreateFixturesResponse,
  FixturesState,
} from "../types/fixtures";
import { apiRequest } from "./client";

function fixturesPath(tournamentSlug: string, stageSlug: string): string {
  return `/tournaments/${encodeURIComponent(tournamentSlug)}/stages/${encodeURIComponent(stageSlug)}/fixtures`;
}

export function getFixtures(
  tournamentSlug: string,
  stageSlug: string,
): Promise<FixturesState> {
  return apiRequest<FixturesState>(fixturesPath(tournamentSlug, stageSlug));
}

export function createFixtures(
  tournamentSlug: string,
  stageSlug: string,
  input: CreateFixturesInput,
): Promise<CreateFixturesResponse> {
  return apiRequest<CreateFixturesResponse>(fixturesPath(tournamentSlug, stageSlug), {
    method: "POST",
    body: JSON.stringify(input),
  });
}