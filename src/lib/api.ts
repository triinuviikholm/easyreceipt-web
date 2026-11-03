import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import type { ApiErrorBody } from "./types";

export function jsonError(status: number, error: string, fieldErrors?: Record<string, string>) {
  const body: ApiErrorBody = fieldErrors ? { error, fieldErrors } : { error };
  return NextResponse.json(body, { status });
}

function redact(text: string) {
  return text.replace(/postgres(ql)?:\/\/\S+/gi, "postgresql://***").slice(0, 500);
}

// Logs a sanitized summary on the server and returns a friendly error to the browser.
export function handleServerError(context: string, err: unknown) {
  const code = (err as { code?: string })?.code;
  const name = (err as Error)?.name ?? "Error";
  console.error(`[api] ${context} failed: ${name}${code ? ` ${code}` : ""} — ${redact(String((err as Error)?.message ?? err))}`);

  if (
    err instanceof Prisma.PrismaClientInitializationError ||
    (err instanceof Prisma.PrismaClientKnownRequestError && ["P1001", "P1002", "P1008", "P1017", "P2024"].includes(err.code))
  ) {
    return jsonError(503, "We couldn't reach the database right now. Please try again in a moment.");
  }
  return jsonError(500, "Something went wrong on our side. Please try again.");
}

export async function readJson(request: Request): Promise<Record<string, unknown> | null> {
  try {
    const body = await request.json();
    return body && typeof body === "object" && !Array.isArray(body) ? (body as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

export function isUniqueViolation(err: unknown) {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002";
}

export function isNotFound(err: unknown) {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025";
}

export function isForeignKeyViolation(err: unknown) {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2003";
}
