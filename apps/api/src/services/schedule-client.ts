import { env } from "../config/env";

export interface ScheduleMatchInput {
  player1: string;
  player2: string;
}

export interface ScheduleRequest {
  numSlots: number;
  numTables: number;
  maxMatchesPerSlot: number;
  scheme: string;
  totalPlayers: string[];
  matches: ScheduleMatchInput[];
}

export interface ScheduledMatch {
  player1: string;
  player2: string;
  hour_slot: number;
  tbl: number;
}

export interface ScheduleServiceResponse {
  status: "ok" | "error";
  error?: string;
  matches?: ScheduledMatch[];
}

export class ScheduleServiceError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "ScheduleServiceError";
  }
}

export async function callScheduleService(
  request: ScheduleRequest,
  baseUrl: string = env.scheduleServiceUrl,
): Promise<ScheduledMatch[]> {
  let response: Response;

  try {
    response = await fetch(`${baseUrl}/schedule`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });
  } catch (err) {
    throw new ScheduleServiceError("Schedule service unreachable", err);
  }

  let body: ScheduleServiceResponse;
  try {
    body = (await response.json()) as ScheduleServiceResponse;
  } catch (err) {
    throw new ScheduleServiceError("Schedule service returned invalid JSON", err);
  }

  if (!response.ok) {
    throw new ScheduleServiceError(
      body.error ?? `Schedule service failed with status ${response.status}`,
    );
  }

  if (body.status !== "ok" || !body.matches) {
    throw new ScheduleServiceError(body.error ?? "Schedule service returned an error");
  }

  return body.matches;
}