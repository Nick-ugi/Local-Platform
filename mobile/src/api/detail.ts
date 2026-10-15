import { ApiError } from "@queenstown/shared";
import { apiGet } from "./client";

/**
 * A detail resource, or null when there is none for the slug. A slug the server refuses to parse
 * (status 400) cannot name one either, so it is treated the same as 404. The web app's rule
 * (web/src/lib/api/detail.ts).
 */
export async function getDetail<T>(
  collection: "places" | "events" | "notices",
  slug: string,
  options?: { signal?: AbortSignal },
): Promise<T | null> {
  try {
    return await apiGet<T>(`/${collection}/${encodeURIComponent(slug)}`, options);
  } catch (error) {
    if (error instanceof ApiError && (error.status === 404 || error.status === 400)) {
      return null;
    }
    throw error;
  }
}

/**
 * "?category=cafe&page=2" from the parameters that are set, or "" when none is. Written out by
 * hand: React Native's URLSearchParams is not the browser's.
 */
export function queryString(params: Record<string, string | number | null | undefined>): string {
  const parts: string[] = [];
  for (const [name, value] of Object.entries(params)) {
    if (value === null || value === undefined || value === "") {
      continue;
    }
    parts.push(`${name}=${encodeURIComponent(String(value))}`);
  }
  return parts.length > 0 ? `?${parts.join("&")}` : "";
}
