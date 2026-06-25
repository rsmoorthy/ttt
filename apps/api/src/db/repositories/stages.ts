import type { StageType } from "../../constants/stage-types";
import { getDb } from "../connection";

export interface Stage {
  slug: string;
  name: string;
  description: string;
  stage_type: StageType;
  is_completed: boolean;
}

interface StageRow {
  slug: string;
  name: string;
  description: string;
  stage_type: string;
  is_completed: number;
}

function toStage(row: StageRow): Stage {
  return {
    slug: row.slug,
    name: row.name,
    description: row.description ?? "",
    stage_type: row.stage_type as StageType,
    is_completed: row.is_completed === 1,
  };
}

export function listStages(tournament: string): Stage[] {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT slug, name, description, stage_type, is_completed
       FROM stages
       WHERE tournament = ?
       ORDER BY name ASC`,
    )
    .all(tournament) as StageRow[];

  return rows.map(toStage);
}

export function findStage(
  tournament: string,
  stageSlug: string,
): Stage | undefined {
  const db = getDb();
  const row = db
    .prepare(
      `SELECT slug, name, description, stage_type, is_completed
       FROM stages
       WHERE tournament = ? AND slug = ?`,
    )
    .get(tournament, stageSlug) as StageRow | undefined;

  return row ? toStage(row) : undefined;
}

export function createStage(
  tournament: string,
  input: {
    slug: string;
    name: string;
    description: string;
    stage_type: StageType;
    is_completed: boolean;
  },
): Stage {
  const db = getDb();
  db.prepare(
    `INSERT INTO stages (tournament, name, slug, description, stage_type, is_completed)
     VALUES (?, ?, ?, ?, ?, ?)`,
  ).run(
    tournament,
    input.name,
    input.slug,
    input.description,
    input.stage_type,
    input.is_completed ? 1 : 0,
  );

  return findStage(tournament, input.slug)!;
}

export function updateStage(
  tournament: string,
  stageSlug: string,
  input: Partial<
    Pick<Stage, "name" | "description" | "stage_type" | "is_completed">
  >,
): Stage | undefined {
  const existing = findStage(tournament, stageSlug);
  if (!existing) {
    return undefined;
  }

  const next = {
    name: input.name ?? existing.name,
    description: input.description ?? existing.description,
    stage_type: input.stage_type ?? existing.stage_type,
    is_completed: input.is_completed ?? existing.is_completed,
  };

  const db = getDb();
  db.prepare(
    `UPDATE stages
     SET name = ?, description = ?, stage_type = ?, is_completed = ?
     WHERE tournament = ? AND slug = ?`,
  ).run(
    next.name,
    next.description,
    next.stage_type,
    next.is_completed ? 1 : 0,
    tournament,
    stageSlug,
  );

  return findStage(tournament, stageSlug);
}

export function deleteStage(tournament: string, stageSlug: string): boolean {
  const db = getDb();
  const result = db
    .prepare("DELETE FROM stages WHERE tournament = ? AND slug = ?")
    .run(tournament, stageSlug);

  return result.changes > 0;
}