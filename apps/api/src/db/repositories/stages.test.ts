import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, before, describe, it } from "node:test";

const projectRoot = path.resolve(import.meta.dirname, "../../../../..");
const tmpDb = path.join(
  os.tmpdir(),
  `ttt-stages-repo-test-${process.pid}-${Date.now()}.db`,
);

type StagesRepo = typeof import("./stages");
type Connection = typeof import("../connection");

let repo: StagesRepo;
let closeDb: Connection["closeDb"];

const tournament = "stages-test-tourn";

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
     VALUES ('Stages Test', ?, '', 'open')`,
  ).run(tournament);

  repo = await import("./stages");
});

after(() => {
  closeDb();
  if (fs.existsSync(tmpDb)) {
    fs.unlinkSync(tmpDb);
  }
});

describe("stages repository", () => {
  it("creates a stage with explicit stage_type", () => {
    const stage = repo.createStage(tournament, {
      slug: "qf",
      name: "Quarter Finals",
      description: "",
      stage_type: "superleague",
      is_completed: false,
    });

    assert.equal(stage.stage_type, "superleague");
    assert.equal(stage.slug, "qf");
  });

  it("lists stages including stage_type", () => {
    const stages = repo.listStages(tournament);
    assert.equal(stages.length, 1);
    assert.equal(stages[0]?.stage_type, "superleague");
  });

  it("updates stage_type", () => {
    const updated = repo.updateStage(tournament, "qf", {
      stage_type: "playoff",
      name: "Semi Final",
    });

    assert.ok(updated);
    assert.equal(updated.stage_type, "playoff");
    assert.equal(updated.name, "Semi Final");
  });

  it("finds a stage by slug", () => {
    const stage = repo.findStage(tournament, "qf");
    assert.ok(stage);
    assert.equal(stage.stage_type, "playoff");
  });

  it("deletes a stage", () => {
    assert.equal(repo.deleteStage(tournament, "qf"), true);
    assert.equal(repo.findStage(tournament, "qf"), undefined);
  });
});