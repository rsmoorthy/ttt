import { Router } from "express";
import {
  computeFixtureSummary,
  hasFixtures,
  listFixtureGroups,
  listFixtureMatches,
  replaceFixtures,
} from "../db/repositories/fixtures";
import { resolveStagePlayers } from "../db/repositories/stage-players";
import { findStage } from "../db/repositories/stages";
import { findTournamentBySlug } from "../db/repositories/tournaments";
import { HttpError } from "../middleware/error-handler";
import { requireAuth } from "../middleware/require-auth";
import { requireRole } from "../middleware/require-role";
import {
  FixtureGenerationError,
  generateFixtures,
} from "../services/fixture-generator";
import { createFixturesSchema } from "../validators/fixtures";

export const fixturesRouter = Router({ mergeParams: true });

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

fixturesRouter.get(
  "/",
  requireAuth,
  requireRole("admin"),
  (req, res, next) => {
    try {
      const { slug, stage: stageSlug } = req.params;
      const stage = requireTournamentAndStage(slug, stageSlug);

      const { source, players } = resolveStagePlayers(slug, stageSlug);
      const groups = listFixtureGroups(slug, stageSlug);
      const matches = listFixtureMatches(slug, stageSlug);
      const fixturesExist = hasFixtures(slug, stageSlug);

      res.json({
        tournament: slug,
        stage: stageSlug,
        stage_type: stage.stage_type,
        players,
        player_source: source,
        has_fixtures: fixturesExist,
        groups: fixturesExist ? groups : {},
        matches: fixturesExist ? matches : [],
        summary: fixturesExist
          ? computeFixtureSummary(
              matches,
              players.map((player) => player.player_name),
            )
          : null,
      });
    } catch (err) {
      next(err);
    }
  },
);

fixturesRouter.post(
  "/",
  requireAuth,
  requireRole("admin"),
  (req, res, next) => {
    try {
      const { slug, stage: stageSlug } = req.params;
      const stage = requireTournamentAndStage(slug, stageSlug);

      const body = createFixturesSchema.parse(req.body);
      const { players } = resolveStagePlayers(slug, stageSlug);
      const playerNames = players.map((player) => player.player_name);

      if (playerNames.length === 0) {
        throw new HttpError(400, "No players available for fixture generation");
      }

      let fixtureResult;
      try {
        fixtureResult = generateFixtures(
          stage.stage_type,
          playerNames,
          body.approx_total_matches,
        );
      } catch (err) {
        if (err instanceof FixtureGenerationError) {
          throw new HttpError(400, err.message);
        }
        throw err;
      }

      replaceFixtures(
        slug,
        stageSlug,
        fixtureResult.groups,
        fixtureResult.matches,
      );

      res.json({
        tournament: slug,
        stage: stageSlug,
        stage_type: stage.stage_type,
        total_matches: fixtureResult.total_matches,
        matches_per_player: fixtureResult.matches_per_player,
        groups: fixtureResult.groups,
        matches: fixtureResult.matches,
      });
    } catch (err) {
      next(err);
    }
  },
);