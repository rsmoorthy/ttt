#!/usr/bin/env bash
# Initialize SQLite database for the TT tournament app.
# Usage: ./create_db.sh [path-to-db]
# Default DB path: data/ttt.db (relative to project root)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DB_PATH="${1:-${SCRIPT_DIR}/../data/ttt.db}"
DB_DIR="$(dirname "${DB_PATH}")"

mkdir -p "${DB_DIR}"

# Remove existing DB only when RESET_DB=1 is set (destructive).
if [[ -f "${DB_PATH}" ]]; then
  if [[ "${RESET_DB:-0}" == "1" ]]; then
    rm -f "${DB_PATH}"
    echo "Removed existing database: ${DB_PATH}"
  else
    echo "Database already exists: ${DB_PATH}"
    echo "Set RESET_DB=1 to recreate from scratch."
    exit 0
  fi
fi

echo "Creating database: ${DB_PATH}"

sqlite3 "${DB_PATH}" <<'SQL'
PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;

-- ---------------------------------------------------------------------------
-- users
-- ---------------------------------------------------------------------------
CREATE TABLE users (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT    NOT NULL UNIQUE,
  password TEXT    NOT NULL,
  role     TEXT    NOT NULL CHECK (role IN ('superadmin', 'admin', 'scorer', 'guest'))
);

-- ---------------------------------------------------------------------------
-- tournament
-- ---------------------------------------------------------------------------
CREATE TABLE tournament (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT    NOT NULL,
  slug        TEXT    NOT NULL UNIQUE,
  description TEXT    DEFAULT '',
  status      TEXT    NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed'))
);

-- ---------------------------------------------------------------------------
-- registration
-- ---------------------------------------------------------------------------
CREATE TABLE registration (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  tournament  TEXT    NOT NULL REFERENCES tournament(slug) ON DELETE CASCADE,
  player_name TEXT    NOT NULL,
  sort_order  INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_registration_tournament ON registration(tournament);

-- ---------------------------------------------------------------------------
-- stages
-- ---------------------------------------------------------------------------
CREATE TABLE stages (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  tournament   TEXT    NOT NULL REFERENCES tournament(slug) ON DELETE CASCADE,
  name         TEXT    NOT NULL,
  slug         TEXT    NOT NULL,
  description  TEXT    DEFAULT '',
  stage_type   TEXT    NOT NULL DEFAULT 'league'
                 CHECK (stage_type IN ('league', 'superleague', 'playoff')),
  is_completed INTEGER NOT NULL DEFAULT 0 CHECK (is_completed IN (0, 1)),
  UNIQUE (tournament, slug)
);

CREATE INDEX idx_stages_tournament ON stages(tournament);

-- ---------------------------------------------------------------------------
-- stages_players
-- ---------------------------------------------------------------------------
CREATE TABLE stages_players (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  tournament  TEXT    NOT NULL,
  stage       TEXT    NOT NULL,
  player_name TEXT    NOT NULL,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (tournament, stage) REFERENCES stages(tournament, slug) ON DELETE CASCADE
);

CREATE INDEX idx_stages_players_tournament_stage ON stages_players(tournament, stage);

-- ---------------------------------------------------------------------------
-- fixture_groups (from external fixture service response)
-- ---------------------------------------------------------------------------
CREATE TABLE fixture_groups (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  tournament  TEXT    NOT NULL,
  stage       TEXT    NOT NULL,
  group_name  TEXT    NOT NULL,
  player_name TEXT    NOT NULL,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (tournament, stage) REFERENCES stages(tournament, slug) ON DELETE CASCADE
);

CREATE INDEX idx_fixture_groups_tournament_stage ON fixture_groups(tournament, stage);

-- ---------------------------------------------------------------------------
-- fixtures (matches: players, schedule, scores)
-- ---------------------------------------------------------------------------
CREATE TABLE fixtures (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  tournament   TEXT    NOT NULL,
  stage        TEXT    NOT NULL,
  slno         INTEGER NOT NULL,
  player1      TEXT    NOT NULL,
  player2      TEXT    NOT NULL,
  table_num    INTEGER,
  hour_slot    INTEGER,
  game1        TEXT    DEFAULT '',
  game2        TEXT    DEFAULT '',
  game3        TEXT    DEFAULT '',
  game4        TEXT    DEFAULT '',
  game5        TEXT    DEFAULT '',
  walkover_win TEXT    DEFAULT '',
  is_completed INTEGER NOT NULL DEFAULT 0 CHECK (is_completed IN (0, 1)),
  FOREIGN KEY (tournament, stage) REFERENCES stages(tournament, slug) ON DELETE CASCADE,
  UNIQUE (tournament, stage, slno)
);

CREATE INDEX idx_fixtures_tournament_stage ON fixtures(tournament, stage);
CREATE INDEX idx_fixtures_schedule ON fixtures(tournament, stage, hour_slot, table_num);
SQL

echo "Schema applied successfully."

# Verify tables were created
sqlite3 "${DB_PATH}" "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name;"

echo "Done."