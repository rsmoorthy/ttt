import { Router } from "express";
import {
  applySchedule,
  buildMatchSummary,
  hasFixtures,
  listFixtureMatches,
  listScheduleMatches,
} from "../db/repositories/fixtures";
import { resolveStagePlayers } from "../db/repositories/stage-players";
import { findStage } from "../db/repositories/stages";
import { findTournamentBySlug } from "../db/repositories/tournaments";
import { HttpError } from "../middleware/error-handler";
import { requireAuth } from "../middleware/require-auth";
import { requireRole } from "../middleware/require-role";
import {
  ScheduleServiceError,
  callScheduleService,
} from "../services/schedule-client";
import { createScheduleSchema } from "../validators/schedule";

export const scheduleRouter = Router({ mergeParams: true });

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

function requireFixtures(slug: string, stageSlug: string) {
  if (!hasFixtures(slug, stageSlug)) {
    throw new HttpError(409, "Create fixtures before scheduling");
  }
}

function matchKey(player1: string, player2: string): string {
  return `${player1}\0${player2}`;
}

function validateScheduledCoverage(
  fixtures: Array<{ player1: string; player2: string }>,
  scheduled: Array<{ player1: string; player2: string; hour_slot: number; tbl: number }>,
): void {
  const scheduledKeys = new Set(
    scheduled.map((match) => matchKey(match.player1, match.player2)),
  );

  for (const fixture of fixtures) {
    if (!scheduledKeys.has(matchKey(fixture.player1, fixture.player2))) {
      throw new ScheduleServiceError(
        `Schedule service did not return slot for ${fixture.player1} vs ${fixture.player2}`,
      );
    }
  }
}

scheduleRouter.get(
  "/",
  requireAuth,
  requireRole("guest"),
  (req, res, next) => {
    try {
      const { slug, stage: stageSlug } = req.params;
      const stage = requireTournamentAndStage(slug, stageSlug);
      requireFixtures(slug, stageSlug);

      const allMatches = listFixtureMatches(slug, stageSlug);

      res.json({
        tournament: slug,
        stage: stageSlug,
        stage_type: stage.stage_type,
        has_fixtures: true,
        matches: listScheduleMatches(slug, stageSlug),
        match_summary: buildMatchSummary(allMatches),
      });
    } catch (err) {
      next(err);
    }
  },
);

scheduleRouter.post(
  "/",
  requireAuth,
  requireRole("admin"),
  async (req, res, next) => {
    try {
      const { slug, stage: stageSlug } = req.params;
      const stage = requireTournamentAndStage(slug, stageSlug);

      if (stage.stage_type !== "league") {
        throw new HttpError(
          400,
          "Automated scheduling is only available for league stages",
        );
      }

      if (!hasFixtures(slug, stageSlug)) {
        throw new HttpError(409, "No fixtures to schedule");
      }

      const body = createScheduleSchema.parse(req.body);
      const fixtures = listFixtureMatches(slug, stageSlug);
      const { players } = resolveStagePlayers(slug, stageSlug);
      const totalPlayers = players.map((player) => player.player_name);

      let scheduled;
      try {
        scheduled = await callScheduleService({
          numSlots: body.numSlots,
          numTables: body.numTables,
          maxMatchesPerSlot: body.maxMatchesPerSlot,
          scheme: stageSlug,
          totalPlayers,
          matches: fixtures.map((match) => ({
            player1: match.player1,
            player2: match.player2,
          })),
        });
        validateScheduledCoverage(fixtures, scheduled);
      } catch (err) {
        if (err instanceof ScheduleServiceError) {
          throw new HttpError(502, err.message);
        }
        throw err;
      }

      applySchedule(slug, stageSlug, scheduled);

      res.json({
        tournament: slug,
        stage: stageSlug,
        matches: scheduled.map((match) => ({
          player1: match.player1,
          player2: match.player2,
          hour_slot: match.hour_slot,
          tbl: match.tbl,
        })),
      });
    } catch (err) {
      next(err);
    }
  },
);