import { STAGE_TYPE_LABELS } from "../constants/stage-types";
import type { StageType } from "../types/stage";

export function formatStageType(stageType: StageType): string {
  return STAGE_TYPE_LABELS[stageType];
}

export function formatCompleted(isCompleted: boolean): string {
  return isCompleted ? "Yes" : "No";
}