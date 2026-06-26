import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, before, describe, it } from "node:test";

const projectRoot = path.resolve(import.meta.dirname, "../../../../..");
const tmpDb = path.join(
  os.tmpdir(),
  `ttt-stage-players-test-${process.pid}-${Date.now()}.db`,
);

type StagePlayersRepo = typeof import("./stage-players");
type Connection = typeof import("../connection");

let repo: StagePlayersRepo;
let closeDb: Connection["closeDb"];
let getDb: Connection["getDb"];

const tournament = "move-players-test";
const leagueStage = "league";
const qfStage = "qf";

before(async () => {
  process.env.DB_PATH = tmpDb;
  execSync(`bash scripts/create_db.sh "${tmpDb}"`, {
    cwd: projectRoot,
    env: { ...process.env, RESET_DB: "1" },
    stdio: "pipe",
  });

  const connection = await import("../connection");
  closeDb = connection.closeDb;
  getDb = connection.getDb;
  getDb();

  const db = connection.getDb();
  db.prepare(
    `INSERT INTO tournament (name, slug, description, status)
     VALUES ('Move Players Test', ?, '', 'open')`,
  ).run(tournament);
  db.prepare(
    `INSERT INTO stages (tournament, slug, name, description, stage_type, is_completed)
     VALUES (?, ?, 'League', '', 'league', 0)`,
  ).run(tournament, leagueStage);
  db.prepare(
    `INSERT INTO stages (tournament, slug, name, description, stage_type, is_completed)
     VALUES (?, ?, 'QF', '', 'superleague', 0)`,
  ).run(tournament, qfStage);

  repo = await import("./stage-players");
});

after(() => {
  closeDb();
  if (fs.existsSync(tmpDb)) {
    fs.unlinkSync(tmpDb);
  }
});

describe("stage-players repository", () => {
  it("replaces players for a target stage with sort_order", () => {
    const players = repo.replaceStagePlayers(tournament, qfStage, [
      "P1",
      "P2",
      "P3",
      "P4",
      "P5",
      "P6",
      "P7",
      "P8",
    ]);

    assert.deepEqual(
      players.map((player) => player.player_name),
      ["P1", "P2", "P3", "P4", "P5", "P6", "P7", "P8"],
    );
    assert.deepEqual(
      players.map((player) => player.sort_order),
      [0, 1, 2, 3, 4, 5, 6, 7],
    );
  });

  it("overwrites an existing moved player list", () => {
    repo.replaceStagePlayers(tournament, qfStage, ["Alice", "Bob"]);
    const players = repo.replaceStagePlayers(tournament, qfStage, [
      "Carol",
      "Dave",
    ]);

    assert.deepEqual(
      players.map((player) => player.player_name),
      ["Carol", "Dave"],
    );
  });

  it("resolves moved players before registration", () => {
    const db = repo.resolveStagePlayers(tournament, qfStage);
    assert.equal(db.source, "stages_players");
    assert.deepEqual(
      db.players.map((player) => player.player_name),
      ["Carol", "Dave"],
    );
  });

  it("falls back to registration when no moved players exist", () => {
    getDb().prepare(
      `INSERT INTO registration (tournament, player_name, sort_order)
       VALUES (?, 'Registered1', 0), (?, 'Registered2', 1)`,
    ).run(tournament, tournament);

    const resolved = repo.resolveStagePlayers(tournament, leagueStage);
    assert.equal(resolved.source, "registration");
    assert.deepEqual(
      resolved.players.map((player) => player.player_name),
      ["Registered1", "Registered2"],
    );
  });
});