import type { NextFunction, Request, Response } from "express";
import type { UserRole } from "../db/repositories/users";
import { hasMinimumRole } from "../constants/roles";
import { HttpError } from "./error-handler";

export function requireRole(minimumRole: UserRole) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const user = req.session.user;
    if (!user) {
      next(new HttpError(401, "Not authenticated"));
      return;
    }

    if (!hasMinimumRole(user.role, minimumRole)) {
      next(new HttpError(403, "Forbidden"));
      return;
    }

    next();
  };
}