import type { Stage } from "../types/stage";

export function targetStageOptions(
  stages: Stage[],
  currentStageSlug: string,
): Stage[] {
  return stages.filter((stage) => stage.slug !== currentStageSlug);
}

export function buildMoveConfirmMessage(
  playerCount: number,
  targetStageLabel: string,
): string {
  return `Move ${playerCount} player(s) to ${targetStageLabel}? This replaces the player list for that stage.`;
}

export function buildMoveSuccessMessage(
  playerCount: number,
  targetStageLabel: string,
): string {
  return `Moved ${playerCount} player(s) to ${targetStageLabel} successfully.`;
}

export function canSubmitMove(
  targetStageSlug: string,
  selectedPlayerCount: number,
): boolean {
  return targetStageSlug !== "" && selectedPlayerCount > 0;
}

export function stageLabel(stages: Stage[], stageSlug: string): string {
  return stages.find((stage) => stage.slug === stageSlug)?.name ?? stageSlug;
}