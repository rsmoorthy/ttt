import type { UserRole } from "../db/repositories/users";

declare module "express-session" {
  interface SessionData {
    user?: {
      id: number;
      username: string;
      role: UserRole;
    };
  }
}