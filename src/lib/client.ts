import type { ApiErrorBody } from "./types";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public fieldErrors?: Record<string, string>,
  ) {
    super(message);
  }
}

// fetch wrapper for our own API: never cached, friendly errors on failure.
export async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      cache: "no-store",
      headers: init?.body ? { "Content-Type": "application/json", ...init?.headers } : init?.headers,
    });
  } catch {
    throw new ApiError("We couldn't connect. Please check your internet connection and try again.", 0);
  }
  if (response.status === 204) return undefined as T;
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const err = body as ApiErrorBody | null;
    throw new ApiError(err?.error ?? "Something went wrong. Please try again.", response.status, err?.fieldErrors);
  }
  return body as T;
}

export function errorMessage(err: unknown) {
  return err instanceof Error ? err.message : "Something went wrong. Please try again.";
}
