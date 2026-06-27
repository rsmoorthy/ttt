import { Router } from "express";
import { listFixtureMatches } from "../db/repositories/fixtures";
import { findStage } from "../db/repositories/stages";
import { findTournamentBySlug } from "../db/repositories/tournaments";
import { HttpError } from "../middleware/error-handler";
import { requireAuth } from "../middleware/require-auth";
import { requireRole } from "../middleware/require-role";
import { computeLeaderboard } from "../services/leaderboard";

export const leaderboardRouter = Router({ mergeParams: true });

function requireTournamentAndStage(slug: string, stageSlug: string) {
  if (!findTournamentBySlug(slug)) {
    throw new HttpError(404, "Tournament not found");
  }

  const stage = findStage(slug, stageSlug);
  if (!stage) {
    throw new HttpError(404, "Stage not found");
  }

  return stage;
}

leaderboardRouter.get(
  "/",
  requireAuth,
  requireRole("guest"),
  (req, res, next) => {
    try {
      const { slug, stage: stageSlug } = req.params;
      requireTournamentAndStage(slug, stageSlug);

      const matches = listFixtureMatches(slug, stageSlug).map((match) => ({
        player1: match.player1,
        player2: match.player2,
        game1: match.game1,
        game2: match.game2,
        game3: match.game3,
        game4: match.game4,
        game5: match.game5,
        walkover_win: match.walkover_win,
        is_completed: match.is_completed,
      }));

      res.json({
        tournament: slug,
        stage: stageSlug,
        entries: computeLeaderboard(matches),
      });
    } catch (err) {
      next(err);
    }
  },
);