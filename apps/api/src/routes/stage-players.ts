import { Router } from "express";
import { resolveStagePlayers } from "../db/repositories/stage-players";
import { findStage } from "../db/repositories/stages";
import { findTournamentBySlug } from "../db/repositories/tournaments";
import { HttpError } from "../middleware/error-handler";
import { requireAuth } from "../middleware/require-auth";
import { requireRole } from "../middleware/require-role";

export const stagePlayersRouter = Router({ mergeParams: true });

stagePlayersRouter.get(
  "/",
  requireAuth,
  requireRole("admin"),
  (req, res, next) => {
    try {
      const { slug, stage: stageSlug } = req.params;

      if (!findTournamentBySlug(slug)) {
        throw new HttpError(404, "Tournament not found");
      }

      if (!findStage(slug, stageSlug)) {
        throw new HttpError(404, "Stage not found");
      }

      const { source, players } = resolveStagePlayers(slug, stageSlug);

      res.json({
        tournament: slug,
        stage: stageSlug,
        source,
        players,
      });
    } catch (err) {
      next(err);
    }
  },
);