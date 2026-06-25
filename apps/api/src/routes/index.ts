import { Router } from "express";
import { getDb } from "../db/connection";
import { authRouter } from "./auth";
import { tournamentsRouter } from "./tournaments";

export const apiRouter = Router();

apiRouter.get("/health", (_req, res) => {
  getDb().prepare("SELECT 1").get();
  res.json({ ok: true, db: "connected" });
});

apiRouter.use("/auth", authRouter);
apiRouter.use("/tournaments", tournamentsRouter);