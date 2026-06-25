import type { NextFunction, Request, Response } from "express";
import { HttpError } from "./error-handler";

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  if (!req.session.user) {
    next(new HttpError(401, "Not authenticated"));
    return;
  }
  next();
}