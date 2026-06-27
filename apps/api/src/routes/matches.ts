import { Router } from "express";
import { hasMinimumRole } from "../constants/roles";
import {
  completeMatch,
  findMatch,
  listMatches,
  updateMatchScores,
} from "../db/repositories/fixtures";
import { findStage } from "../db/repositories/stages";
import { findTournamentBySlug } from "../db/repositories/tournaments";
import type { UserRole } from "../db/repositories/users";
import { HttpError } from "../middleware/error-handler";
import { requireAuth } from "../middleware/require-auth";
import { requireRole } from "../middleware/require-role";
import {
  hasScoreContent,
  validateMatchScores,
} from "../services/score-validation";
import { listMatchesQuerySchema, patchMatchSchema } from "../validators/scores";

export const matchesRouter = Router({ mergeParams: true });

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

function parseSlno(raw: string): number {
  const slno = Number(raw);
  if (!Number.isInteger(slno) || slno <= 0) {
    throw new HttpError(404, "Match not found");
  }
  return slno;
}

function requireMatch(slug: string, stageSlug: string, slno: number) {
  const match = findMatch(slug, stageSlug, slno);
  if (!match) {
    throw new HttpError(404, "Match not found");
  }
  return match;
}

function rejectCompletedMatchForScorer(
  match: { is_completed: boolean },
  role: UserRole,
): void {
  if (match.is_completed && !hasMinimumRole(role, "admin")) {
    throw new HttpError(403, "Cannot update a completed match");
  }
}

matchesRouter.get(
  "/",
  requireAuth,
  requireRole("guest"),
  (req, res, next) => {
    try {
      const { slug, stage: stageSlug } = req.params;
      requireTournamentAndStage(slug, stageSlug);

      const query = listMatchesQuerySchema.parse(req.query);
      const { matches, filter_options, match_summary } = listMatches(
        slug,
        stageSlug,
        {
          player: query.player,
          hour_slot: query.hour_slot,
          completion: query.completion,
        },
      );

      res.json({
        tournament: slug,
        stage: stageSlug,
        filters: {
          player: query.player ?? null,
          hour_slot: query.hour_slot ?? null,
          completion: query.completion ?? null,
        },
        matches,
        filter_options,
        match_summary,
      });
    } catch (err) {
      next(err);
    }
  },
);

matchesRouter.patch(
  "/:slno",
  requireAuth,
  requireRole("scorer"),
  (req, res, next) => {
    try {
      const { slug, stage: stageSlug, slno: slnoRaw } = req.params;
      requireTournamentAndStage(slug, stageSlug);
      const slno = parseSlno(slnoRaw);
      const match = requireMatch(slug, stageSlug, slno);

      rejectCompletedMatchForScorer(match, req.session.user!.role);

      const body = patchMatchSchema.parse(req.body);
      const nextState = {
        game1: body.game1 ?? match.game1,
        game2: body.game2 ?? match.game2,
        game3: body.game3 ?? match.game3,
        game4: body.game4 ?? match.game4,
        game5: body.game5 ?? match.game5,
        walkover_win: body.walkover_win ?? match.walkover_win,
      };

      const fieldErrors = validateMatchScores(
        nextState,
        match.player1,
        match.player2,
      );
      if (fieldErrors) {
        throw new HttpError(400, "Score validation failed", fieldErrors);
      }

      const updated = updateMatchScores(slug, stageSlug, slno, body);
      res.json(updated);
    } catch (err) {
      next(err);
    }
  },
);

matchesRouter.post(
  "/:slno/complete",
  requireAuth,
  requireRole("scorer"),
  (req, res, next) => {
    try {
      const { slug, stage: stageSlug, slno: slnoRaw } = req.params;
      requireTournamentAndStage(slug, stageSlug);
      const slno = parseSlno(slnoRaw);
      const match = requireMatch(slug, stageSlug, slno);

      if (match.is_completed) {
        throw new HttpError(409, "Match is already completed");
      }

      const scoreState = {
        game1: match.game1,
        game2: match.game2,
        game3: match.game3,
        game4: match.game4,
        game5: match.game5,
        walkover_win: match.walkover_win,
      };

      if (!hasScoreContent(scoreState)) {
        throw new HttpError(400, "Cannot complete match without scores or walkover");
      }

      const fieldErrors = validateMatchScores(
        scoreState,
        match.player1,
        match.player2,
      );
      if (fieldErrors) {
        throw new HttpError(400, "Score validation failed", fieldErrors);
      }

      const updated = completeMatch(slug, stageSlug, slno);
      res.json(updated);
    } catch (err) {
      next(err);
    }
  },
);