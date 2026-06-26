import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import { env } from "../config/env";

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (db) {
    return db;
  }

  const dir = path.dirname(env.dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  db = new Database(env.dbPath);
  db.pragma("foreign_keys = ON");
  db.pragma("journal_mode = WAL");
  migrate(db);

  return db;
}

function tableColumns(
  database: Database.Database,
  table: string,
): Array<{ name: string }> {
  return database.prepare(`PRAGMA table_info(${table})`).all() as Array<{
    name: string;
  }>;
}

function migrate(database: Database.Database): void {
  const stagesTable = database
    .prepare(
      `SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'stages'`,
    )
    .get() as { name: string } | undefined;

  if (!stagesTable) {
    return;
  }

  const stageColumns = tableColumns(database, "stages");

  if (!stageColumns.some((column) => column.name === "stage_type")) {
    database.exec(
      `ALTER TABLE stages ADD COLUMN stage_type TEXT NOT NULL DEFAULT 'league'`,
    );
  }

  const fixturesTable = database
    .prepare(
      `SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'fixtures'`,
    )
    .get() as { name: string } | undefined;

  if (!fixturesTable) {
    return;
  }

  const fixtureColumns = tableColumns(database, "fixtures");

  if (
    fixtureColumns.some((column) => column.name === "table_num") &&
    !fixtureColumns.some((column) => column.name === "tbl")
  ) {
    database.exec(`ALTER TABLE fixtures RENAME COLUMN table_num TO tbl`);
  }
}

export function closeDb(): void {
  if (db) {
    db.close();
    db = null;
  }
}