import { getDb } from "../connection";

export type TournamentStatus = "open" | "closed";

export interface Tournament {
  slug: string;
  name: string;
  description: string;
  status: TournamentStatus;
}

interface TournamentRow {
  slug: string;
  name: string;
  description: string;
  status: TournamentStatus;
}

function toTournament(row: TournamentRow): Tournament {
  return {
    slug: row.slug,
    name: row.name,
    description: row.description ?? "",
    status: row.status,
  };
}

export function listTournaments(): Tournament[] {
  const db = getDb();
  const rows = db
    .prepare(
      "SELECT slug, name, description, status FROM tournament ORDER BY name ASC",
    )
    .all() as TournamentRow[];

  return rows.map(toTournament);
}

export function findTournamentBySlug(slug: string): Tournament | undefined {
  const db = getDb();
  const row = db
    .prepare(
      "SELECT slug, name, description, status FROM tournament WHERE slug = ?",
    )
    .get(slug) as TournamentRow | undefined;

  return row ? toTournament(row) : undefined;
}

export function createTournament(input: {
  slug: string;
  name: string;
  description: string;
  status: TournamentStatus;
}): Tournament {
  const db = getDb();
  db.prepare(
    `INSERT INTO tournament (slug, name, description, status)
     VALUES (?, ?, ?, ?)`,
  ).run(input.slug, input.name, input.description, input.status);

  return findTournamentBySlug(input.slug)!;
}

export function updateTournament(
  slug: string,
  input: Partial<Pick<Tournament, "name" | "description" | "status">>,
): Tournament | undefined {
  const existing = findTournamentBySlug(slug);
  if (!existing) {
    return undefined;
  }

  const next = {
    name: input.name ?? existing.name,
    description: input.description ?? existing.description,
    status: input.status ?? existing.status,
  };

  const db = getDb();
  db.prepare(
    `UPDATE tournament
     SET name = ?, description = ?, status = ?
     WHERE slug = ?`,
  ).run(next.name, next.description, next.status, slug);

  return findTournamentBySlug(slug);
}

export function deleteTournament(slug: string): boolean {
  const db = getDb();
  const result = db
    .prepare("DELETE FROM tournament WHERE slug = ?")
    .run(slug);

  return result.changes > 0;
}