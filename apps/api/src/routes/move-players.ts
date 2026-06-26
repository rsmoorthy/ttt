import { Router } from "express";
import { replaceStagePlayers } from "../db/repositories/stage-players";
import { findStage } from "../db/repositories/stages";
import { findTournamentBySlug } from "../db/repositories/tournaments";
import { HttpError } from "../middleware/error-handler";
import { requireAuth } from "../middleware/require-auth";
import { requireRole } from "../middleware/require-role";
import { movePlayersSchema } from "../validators/move-players";

export const movePlayersRouter = Router({ mergeParams: true });

function requireTournament(slug: string) {
  if (!findTournamentBySlug(slug)) {
    throw new HttpError(404, "Tournament not found");
  }
}

function requireStage(slug: string, stageSlug: string) {
  const stage = findStage(slug, stageSlug);
  if (!stage) {
    throw new HttpError(404, "Stage not found");
  }
  return stage;
}

movePlayersRouter.post(
  "/",
  requireAuth,
  requireRole("admin"),
  (req, res, next) => {
    try {
      const { slug, stage: sourceStage } = req.params;
      requireTournament(slug);
      requireStage(slug, sourceStage);

      const body = movePlayersSchema.parse(req.body);

      if (body.target_stage === sourceStage) {
        throw new HttpError(409, "target_stage must differ from source stage");
      }

      if (!findStage(slug, body.target_stage)) {
        throw new HttpError(404, "Target stage not found");
      }

      const players = replaceStagePlayers(
        slug,
        body.target_stage,
        body.players,
      );

      res.json({
        tournament: slug,
        source_stage: sourceStage,
        target_stage: body.target_stage,
        players,
      });
    } catch (err) {
      next(err);
    }
  },
);