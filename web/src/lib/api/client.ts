import { ApiError, requestJson } from "@queenstown/shared";

// ApiError and the reading of error responses are shared with the app (shared/src/http.ts).
export { ApiError };
export type { ApiErrorCode } from "@queenstown/shared";

const DEFAULT_BASE_URL = "http://localhost:8080";

/** Where the backend is. Only the server knows this; a browser calls the site's own origin. */
export function backendBaseUrl(): string {
  return process.env.API_BASE_URL || DEFAULT_BASE_URL;
}

/**
 * GET /api/v1{path}. On the server the request goes straight to the backend. In a browser it goes
 * to this site's own /api/v1, which app/api/v1/[...path]/route.ts forwards, so no CORS is involved.
 *
 * Rejects with an ApiError for every failure. A request the caller cancelled is not a failure:
 * it rejects with the abort error itself.
 */
export function apiGet<T>(path: string, options: { signal?: AbortSignal } = {}): Promise<T> {
  const origin = typeof window === "undefined" ? backendBaseUrl() : "";
  return requestJson<T>(`${origin}/api/v1${path}`, { cache: "no-store", signal: options.signal });
}
