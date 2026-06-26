import type { StageType } from "../types/stage";

export const STAGE_TYPES: StageType[] = ["league", "superleague", "playoff"];

export const STAGE_TYPE_LABELS: Record<StageType, string> = {
  league: "League",
  superleague: "Super League",
  playoff: "Playoff",
};