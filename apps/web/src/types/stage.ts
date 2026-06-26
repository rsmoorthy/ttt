export type StageType = "league" | "superleague" | "playoff";

export interface Stage {
  slug: string;
  name: string;
  description: string;
  stage_type: StageType;
  is_completed: boolean;
}

export interface StageListResponse {
  tournament: string;
  stages: Stage[];
}

export interface StageDetail extends Stage {
  tournament: string;
}

export interface CreateStageInput {
  name: string;
  slug: string;
  description?: string;
  stage_type?: StageType;
  is_completed?: boolean;
}

export interface UpdateStageInput {
  name?: string;
  description?: string;
  stage_type?: StageType;
  is_completed?: boolean;
}