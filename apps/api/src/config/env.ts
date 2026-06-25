import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

function resolveDbPath(raw: string): string {
  if (path.isAbsolute(raw)) {
    return raw;
  }
  return path.resolve(process.cwd(), raw);
}

export const env = {
  port: Number(process.env.PORT ?? 3000),
  dbPath: resolveDbPath(process.env.DB_PATH ?? "./data/ttt.db"),
  sessionSecret: process.env.SESSION_SECRET ?? "dev-session-secret-change-me",
  nodeEnv: process.env.NODE_ENV ?? "development",
  trustProxy: process.env.TRUST_PROXY === "1",
} as const;