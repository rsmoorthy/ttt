import path from "path";
import dotenv from "dotenv";

/** Monorepo root — DB_PATH and .env are resolved from here, not process.cwd(). */
const REPO_ROOT = path.resolve(__dirname, "../../../..");

dotenv.config({ path: path.join(REPO_ROOT, ".env") });

function resolveDbPath(raw: string): string {
  if (path.isAbsolute(raw)) {
    return raw;
  }
  return path.resolve(REPO_ROOT, raw);
}

function parseSessionCookieSecure(): boolean {
  const raw = process.env.SESSION_COOKIE_SECURE;
  if (raw === "0" || raw === "false") {
    return false;
  }
  if (raw === "1" || raw === "true") {
    return true;
  }
  return (process.env.NODE_ENV ?? "development") === "production";
}

export const env = {
  host: process.env.HOST ?? "0.0.0.0",
  port: Number(process.env.PORT ?? 3000),
  dbPath: resolveDbPath(process.env.DB_PATH ?? "./data/ttt.db"),
  sessionSecret: process.env.SESSION_SECRET ?? "dev-session-secret-change-me",
  nodeEnv: process.env.NODE_ENV ?? "development",
  sessionCookieSecure: parseSessionCookieSecure(),
  trustProxy: process.env.TRUST_PROXY === "1",
  scheduleServiceUrl:
    process.env.SCHEDULE_SERVICE_URL ?? "http://127.0.0.1:8383",
} as const;