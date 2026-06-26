import type { StageType } from "../types/stage";

export function showApproxTotalMatches(stageType: StageType): boolean {
  return stageType === "league";
}

export const FIXTURE_REGENERATE_CONFIRM =
  "This action is dangerous and will remove all existing fixtures and scores for this stage. Continue?";