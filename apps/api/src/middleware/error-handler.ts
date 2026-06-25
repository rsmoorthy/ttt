import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

export class HttpError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public fields?: Record<string, string>,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof HttpError) {
    res.status(err.statusCode).json({
      error: err.message,
      ...(err.fields ? { fields: err.fields } : {}),
    });
    return;
  }

  if (err instanceof ZodError) {
    const fields: Record<string, string> = {};
    for (const issue of err.issues) {
      const key = issue.path.join(".") || "body";
      fields[key] = issue.message;
    }
    res.status(400).json({
      error: "Validation failed",
      fields,
    });
    return;
  }

  console.error(err);
  res.status(500).json({ error: "Internal server error" });
}