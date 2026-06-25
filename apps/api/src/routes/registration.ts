import { Router } from "express";
import { findTournamentBySlug } from "../db/repositories/tournaments";
import { listRegistration, replaceRegistration } from "../db/repositories/registration";
import { HttpError } from "../middleware/error-handler";
import { requireAuth } from "../middleware/require-auth";
import { requireRole } from "../middleware/require-role";
import {
  normalizeRegistrationPlayers,
  replaceRegistrationSchema,
} from "../validators/registration";

export const registrationRouter = Router({ mergeParams: true });

function requireTournament(slug: string) {
  const tournament = findTournamentBySlug(slug);
  if (!tournament) {
    throw new HttpError(404, "Tournament not found");
  }
  return tournament;
}

registrationRouter.get(
  "/",
  requireAuth,
  requireRole("guest"),
  (req, res, next) => {
    try {
      const { slug } = req.params;
      requireTournament(slug);
      res.json({
        tournament: slug,
        players: listRegistration(slug),
      });
    } catch (err) {
      next(err);
    }
  },
);

registrationRouter.put(
  "/",
  requireAuth,
  requireRole("admin"),
  (req, res, next) => {
    try {
      const { slug } = req.params;
      requireTournament(slug);
      const body = replaceRegistrationSchema.parse(req.body);
      const players = normalizeRegistrationPlayers(body.players);
      const saved = replaceRegistration(slug, players);

      res.json({
        tournament: slug,
        players: saved,
      });
    } catch (err) {
      next(err);
    }
  },
);