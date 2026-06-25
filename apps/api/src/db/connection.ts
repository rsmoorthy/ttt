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

function migrate(database: Database.Database): void {
  const stageColumns = database
    .prepare("PRAGMA table_info(stages)")
    .all() as Array<{ name: string }>;

  if (!stageColumns.some((column) => column.name === "stage_type")) {
    database.exec(
      `ALTER TABLE stages ADD COLUMN stage_type TEXT NOT NULL DEFAULT 'league'`,
    );
  }
}

export function closeDb(): void {
  if (db) {
    db.close();
    db = null;
  }
}