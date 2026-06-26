import assert from "node:assert/strict";
import http from "node:http";
import { after, before, describe, it } from "node:test";
import {
  ScheduleServiceError,
  callScheduleService,
  type ScheduleRequest,
} from "./schedule-client";

const requestBody: ScheduleRequest = {
  numSlots: 3,
  numTables: 2,
  maxMatchesPerSlot: 4,
  scheme: "league",
  totalPlayers: ["Alice", "Bob"],
  matches: [{ player1: "Alice", player2: "Bob" }],
};

let server: http.Server;
let baseUrl = "";

before(() => {
  server = http.createServer((req, res) => {
    if (req.method === "POST" && req.url === "/schedule") {
      let raw = "";
      req.on("data", (chunk) => {
        raw += chunk;
      });
      req.on("end", () => {
        const body = JSON.parse(raw) as ScheduleRequest;
        if (body.scheme === "error") {
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              status: "error",
              error: "No solution found",
            }),
          );
          return;
        }

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            status: "ok",
            matches: body.matches.map((match) => ({
              player1: match.player1,
              player2: match.player2,
              hour_slot: 1,
              tbl: 1,
            })),
          }),
        );
      });
      return;
    }

    res.writeHead(404);
    res.end();
  });

  return new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        throw new Error("Failed to bind mock schedule server");
      }
      baseUrl = `http://127.0.0.1:${address.port}`;
      resolve();
    });
  });
});

after(() => {
  return new Promise<void>((resolve, reject) => {
    server.close((err) => {
      if (err) {
        reject(err);
        return;
      }
      resolve();
    });
  });
});

describe("callScheduleService", () => {
  it("returns scheduled matches on success", async () => {
    const matches = await callScheduleService(requestBody, baseUrl);
    assert.equal(matches.length, 1);
    assert.deepEqual(matches[0], {
      player1: "Alice",
      player2: "Bob",
      hour_slot: 1,
      tbl: 1,
    });
  });

  it("throws ScheduleServiceError when service reports error status", async () => {
    await assert.rejects(
      () =>
        callScheduleService(
          { ...requestBody, scheme: "error" },
          baseUrl,
        ),
      (err: unknown) =>
        err instanceof ScheduleServiceError &&
        err.message === "No solution found",
    );
  });

  it("throws ScheduleServiceError when service is unreachable", async () => {
    await assert.rejects(
      () => callScheduleService(requestBody, "http://127.0.0.1:1"),
      (err: unknown) =>
        err instanceof ScheduleServiceError &&
        err.message === "Schedule service unreachable",
    );
  });
});