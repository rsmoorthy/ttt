import Database from "better-sqlite3";
import { Router } from "express";
import {
  createTournament,
  deleteTournament,
  findTournamentBySlug,
  listTournaments,
  updateTournament,
} from "../db/repositories/tournaments";
import { HttpError } from "../middleware/error-handler";
import { requireAuth } from "../middleware/require-auth";
import { requireRole } from "../middleware/require-role";
import {
  createTournamentSchema,
  updateTournamentSchema,
} from "../validators/tournaments";
import { registrationRouter } from "./registration";
import { stagesRouter } from "./stages";

export const tournamentsRouter = Router();

tournamentsRouter.use("/:slug/registration", registrationRouter);
tournamentsRouter.use("/:slug/stages", stagesRouter);

tournamentsRouter.get("/", requireAuth, requireRole("guest"), (_req, res) => {
  res.json({ tournaments: listTournaments() });
});

tournamentsRouter.post(
  "/",
  requireAuth,
  requireRole("superadmin"),
  (req, res, next) => {
    try {
      const body = createTournamentSchema.parse(req.body);
      const tournament = createTournament({
        slug: body.slug,
        name: body.name,
        description: body.description,
        status: body.status,
      });
      res.status(201).json(tournament);
    } catch (err) {
      if (
        err instanceof Database.SqliteError &&
        err.code === "SQLITE_CONSTRAINT_UNIQUE"
      ) {
        next(new HttpError(409, "Tournament slug already exists"));
        return;
      }
      next(err);
    }
  },
);

tournamentsRouter.get(
  "/:slug",
  requireAuth,
  requireRole("guest"),
  (req, res, next) => {
    try {
      const tournament = findTournamentBySlug(req.params.slug);
      if (!tournament) {
        throw new HttpError(404, "Tournament not found");
      }
      res.json(tournament);
    } catch (err) {
      next(err);
    }
  },
);

tournamentsRouter.put(
  "/:slug",
  requireAuth,
  requireRole("superadmin"),
  (req, res, next) => {
    try {
      const body = updateTournamentSchema.parse(req.body);
      const tournament = updateTournament(req.params.slug, body);
      if (!tournament) {
        throw new HttpError(404, "Tournament not found");
      }
      res.json(tournament);
    } catch (err) {
      next(err);
    }
  },
);

tournamentsRouter.delete(
  "/:slug",
  requireAuth,
  requireRole("superadmin"),
  (req, res, next) => {
    try {
      const deleted = deleteTournament(req.params.slug);
      if (!deleted) {
        throw new HttpError(404, "Tournament not found");
      }
      res.sendStatus(204);
    } catch (err) {
      next(err);
    }
  },
);