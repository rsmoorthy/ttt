import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, before, describe, it } from "node:test";

const projectRoot = path.resolve(import.meta.dirname, "../../../../..");
const tmpDb = path.join(
  os.tmpdir(),
  `ttt-matches-repo-test-${process.pid}-${Date.now()}.db`,
);

type FixturesRepo = typeof import("./fixtures");
type Connection = typeof import("../connection");

let repo: FixturesRepo;
let closeDb: Connection["closeDb"];

const tournament = "matches-test-tourn";
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
     VALUES ('Matches Test', ?, '', 'open')`,
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

  repo.applySchedule(tournament, stage, [
    { player1: "Alice", player2: "Bob", hour_slot: 2, tbl: 1 },
    { player1: "Carol", player2: "Dave", hour_slot: 1, tbl: 2 },
  ]);
});

after(() => {
  closeDb();
  if (fs.existsSync(tmpDb)) {
    fs.unlinkSync(tmpDb);
  }
});

describe("fixtures matches repository", () => {
  it("lists matches sorted by hour_slot then tbl", () => {
    const { matches } = repo.listMatches(tournament, stage);
    assert.deepEqual(
      matches.map((match) => [match.slno, match.hour_slot, match.tbl]),
      [
        [2, 1, 2],
        [1, 2, 1],
      ],
    );
  });

  it("filters matches by player", () => {
    const { matches } = repo.listMatches(tournament, stage, { player: "Alice" });
    assert.equal(matches.length, 1);
    assert.equal(matches[0]?.player1, "Alice");
  });

  it("filters matches by completion status", () => {
    repo.completeMatch(tournament, stage, 1);

    const pending = repo.listMatches(tournament, stage, { completion: "pending" });
    assert.equal(pending.matches.length, 1);
    assert.equal(pending.matches[0]?.slno, 2);

    const completed = repo.listMatches(tournament, stage, {
      completion: "completed",
    });
    assert.equal(completed.matches.length, 1);
    assert.equal(completed.matches[0]?.slno, 1);
    assert.equal(completed.matches[0]?.is_completed, true);
  });

  it("updates match scores", () => {
    const updated = repo.updateMatchScores(tournament, stage, 1, {
      game1: "11-7",
      game2: "8-11",
      game3: "11-9",
    });

    assert.ok(updated);
    assert.equal(updated.game1, "11-7");
    assert.equal(updated.game3, "11-9");
    assert.equal(updated.tbl, 1);
  });

  it("marks a match complete", () => {
    const completed = repo.completeMatch(tournament, stage, 1);
    assert.ok(completed);
    assert.equal(completed.is_completed, true);
  });

  it("builds filter options from all matches", () => {
    const { filter_options } = repo.listMatches(tournament, stage);
    assert.deepEqual(filter_options.players, ["Alice", "Bob", "Carol", "Dave"]);
    assert.deepEqual(filter_options.hour_slots, [1, 2]);
  });
});