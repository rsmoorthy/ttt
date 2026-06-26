import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, before, describe, it } from "node:test";

const projectRoot = path.resolve(import.meta.dirname, "../../../../..");
const tmpDb = path.join(
  os.tmpdir(),
  `ttt-fixtures-schedule-test-${process.pid}-${Date.now()}.db`,
);

type FixturesRepo = typeof import("./fixtures");
type Connection = typeof import("../connection");

let repo: FixturesRepo;
let closeDb: Connection["closeDb"];

const tournament = "schedule-test-tourn";
const stage = "league";

before(async () => {
  process.env.DB_PATH = tmpDb;
  execSync(`bash scripts/create_db.sh "${tmpDb}"`, {
    cwd: projectRoot,
    env: { ...process.env, RESET_DB: "1" },
    stdio: "pipe",
  });

  const connection = await import("../connection");
  closeDb = connection.closeDb;
  connection.getDb();

  const db = connection.getDb();
  db.prepare(
    `INSERT INTO tournament (name, slug, description, status)
     VALUES ('Schedule Test', ?, '', 'open')`,
  ).run(tournament);
  db.prepare(
    `INSERT INTO stages (tournament, slug, name, description, stage_type, is_completed)
     VALUES (?, ?, 'League', '', 'league', 0)`,
  ).run(tournament, stage);

  repo = await import("./fixtures");
  repo.replaceFixtures(
    tournament,
    stage,
    { A: ["Alice", "Bob"], B: ["Carol", "Dave"] },
    [
      { slno: 1, player1: "Alice", player2: "Bob" },
      { slno: 2, player1: "Carol", player2: "Dave" },
    ],
  );
});

after(() => {
  closeDb();
  if (fs.existsSync(tmpDb)) {
    fs.unlinkSync(tmpDb);
  }
});

describe("fixtures schedule repository", () => {
  it("lists schedule matches with tbl field", () => {
    const matches = repo.listScheduleMatches(tournament, stage);
    assert.equal(matches.length, 2);
    assert.equal(matches[0]?.tbl, null);
    assert.equal(matches[0]?.hour_slot, null);
    assert.equal("table" in (matches[0] ?? {}), false);
  });

  it("applies schedule updates for all fixtures", () => {
    const updated = repo.applySchedule(tournament, stage, [
      {
        player1: "Alice",
        player2: "Bob",
        hour_slot: 1,
        tbl: 2,
      },
      {
        player1: "Carol",
        player2: "Dave",
        hour_slot: 2,
        tbl: 1,
      },
    ]);

    assert.deepEqual(updated[0], {
      slno: 1,
      player1: "Alice",
      player2: "Bob",
      tbl: 2,
      hour_slot: 1,
      is_completed: false,
    });
    assert.deepEqual(updated[1], {
      slno: 2,
      player1: "Carol",
      player2: "Dave",
      tbl: 1,
      hour_slot: 2,
      is_completed: false,
    });
  });

  it("overwrites an existing schedule", () => {
    const updated = repo.applySchedule(tournament, stage, [
      {
        player1: "Alice",
        player2: "Bob",
        hour_slot: 3,
        tbl: 1,
      },
      {
        player1: "Carol",
        player2: "Dave",
        hour_slot: 3,
        tbl: 2,
      },
    ]);

    assert.equal(updated[0]?.hour_slot, 3);
    assert.equal(updated[0]?.tbl, 1);
    assert.equal(updated[1]?.hour_slot, 3);
    assert.equal(updated[1]?.tbl, 2);
  });
});