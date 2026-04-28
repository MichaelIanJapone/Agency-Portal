import { ZodError } from "zod";

import { AppError } from "@/server/http-errors";

export function handleRouteError(error: unknown) {
  if (error instanceof AppError) {
    return Response.json(
      { error: error.message, details: error.details ?? null },
      { status: error.statusCode },
    );
  }

  if (error instanceof ZodError) {
    return Response.json(
      { error: "Validation failed", details: error.flatten() },
      { status: 400 },
    );
  }

  console.error("Unhandled route error:", error);
  return Response.json({ error: "Internal server error" }, { status: 500 });
}
