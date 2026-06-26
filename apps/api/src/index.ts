import { createApp } from "./app";
import { env } from "./config/env";
import { closeDb, getDb } from "./db/connection";

const app = createApp();

getDb();

const server = app.listen(env.port, env.host, () => {
  console.log(`API listening on http://${env.host}:${env.port}`);
  console.log(`Database: ${env.dbPath}`);
});

function shutdown(signal: string) {
  console.log(`Received ${signal}, shutting down...`);
  server.close(() => {
    closeDb();
    process.exit(0);
  });
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));