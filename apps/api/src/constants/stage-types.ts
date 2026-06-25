export const STAGE_TYPES = ["league", "superleague", "playoff"] as const;

export type StageType = (typeof STAGE_TYPES)[number];

export function isStageType(value: string): value is StageType {
  return (STAGE_TYPES as readonly string[]).includes(value);
}