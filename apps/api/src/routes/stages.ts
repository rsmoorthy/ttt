import Database from "better-sqlite3";
import { Router } from "express";
import {
  createStage,
  deleteStage,
  findStage,
  listStages,
  updateStage,
} from "../db/repositories/stages";
import { findTournamentBySlug } from "../db/repositories/tournaments";
import { HttpError } from "../middleware/error-handler";
import { requireAuth } from "../middleware/require-auth";
import { requireRole } from "../middleware/require-role";
import { createStageSchema, updateStageSchema } from "../validators/stages";
import { fixturesRouter } from "./fixtures";
import { leaderboardRouter } from "./leaderboard";
import { matchesRouter } from "./matches";
import { movePlayersRouter } from "./move-players";
import { scheduleRouter } from "./schedule";
import { stagePlayersRouter } from "./stage-players";

export const stagesRouter = Router({ mergeParams: true });

stagesRouter.use("/:stage/players", stagePlayersRouter);
stagesRouter.use("/:stage/fixtures", fixturesRouter);
stagesRouter.use("/:stage/schedule", scheduleRouter);
stagesRouter.use("/:stage/matches", matchesRouter);
stagesRouter.use("/:stage/leaderboard", leaderboardRouter);
stagesRouter.use("/:stage/move-players", movePlayersRouter);

function requireTournament(slug: string) {
  const tournament = findTournamentBySlug(slug);
  if (!tournament) {
    throw new HttpError(404, "Tournament not found");
  }
  return tournament;
}

function stageResponse(tournament: string, stage: ReturnType<typeof findStage>) {
  return {
    tournament,
    slug: stage!.slug,
    name: stage!.name,
    description: stage!.description,
    stage_type: stage!.stage_type,
    is_completed: stage!.is_completed,
  };
}

stagesRouter.get("/", requireAuth, requireRole("guest"), (req, res, next) => {
  try {
    const { slug } = req.params;
    requireTournament(slug);
    res.json({
      tournament: slug,
      stages: listStages(slug),
    });
  } catch (err) {
    next(err);
  }
});

stagesRouter.post(
  "/",
  requireAuth,
  requireRole("admin"),
  (req, res, next) => {
    try {
      const { slug } = req.params;
      requireTournament(slug);
      const body = createStageSchema.parse(req.body);
      const stage = createStage(slug, {
        slug: body.slug,
        name: body.name,
        description: body.description,
        stage_type: body.stage_type,
        is_completed: body.is_completed,
      });
      res.status(201).json(stage);
    } catch (err) {
      if (
        err instanceof Database.SqliteError &&
        err.code === "SQLITE_CONSTRAINT_UNIQUE"
      ) {
        next(new HttpError(409, "Stage slug already exists for this tournament"));
        return;
      }
      next(err);
    }
  },
);

stagesRouter.get(
  "/:stage",
  requireAuth,
  requireRole("guest"),
  (req, res, next) => {
    try {
      const { slug, stage: stageSlug } = req.params;
      requireTournament(slug);
      const stage = findStage(slug, stageSlug);
      if (!stage) {
        throw new HttpError(404, "Stage not found");
      }
      res.json(stageResponse(slug, stage));
    } catch (err) {
      next(err);
    }
  },
);

stagesRouter.put(
  "/:stage",
  requireAuth,
  requireRole("admin"),
  (req, res, next) => {
    try {
      const { slug, stage: stageSlug } = req.params;
      requireTournament(slug);
      const body = updateStageSchema.parse(req.body);
      const stage = updateStage(slug, stageSlug, body);
      if (!stage) {
        throw new HttpError(404, "Stage not found");
      }
      res.json(stageResponse(slug, stage));
    } catch (err) {
      next(err);
    }
  },
);

stagesRouter.delete(
  "/:stage",
  requireAuth,
  requireRole("admin"),
  (req, res, next) => {
    try {
      const { slug, stage: stageSlug } = req.params;
      requireTournament(slug);
      const deleted = deleteStage(slug, stageSlug);
      if (!deleted) {
        throw new HttpError(404, "Stage not found");
      }
      res.sendStatus(204);
    } catch (err) {
      next(err);
    }
  },
);