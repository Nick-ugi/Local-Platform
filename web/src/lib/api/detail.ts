import { ApiError, apiGet } from "./client";

/**
 * A detail resource, or null when there is none for the slug. A slug the server refuses to parse
 * (status 400) cannot name one either, so it is treated the same as 404.
 */
export async function getDetail<T>(collection: "places" | "events" | "notices", slug: string): Promise<T | null> {
  try {
    return await apiGet<T>(`/${collection}/${encodeURIComponent(slug)}`);
  } catch (error) {
    if (error instanceof ApiError && (error.status === 404 || error.status === 400)) {
      return null;
    }
    throw error;
  }
}

/** "/events?when=week&page=2" from a path and the parameters that are set. Page 1 is left out. */
export function withQuery(path: string, params: Record<string, string | number | null | undefined>): string {
  const query = new URLSearchParams();
  for (const [name, value] of Object.entries(params)) {
    if (value === null || value === undefined || value === "" || (name === "page" && Number(value) <= 1)) {
      continue;
    }
    query.set(name, String(value));
  }
  const search = query.toString();
  return search ? `${path}?${search}` : path;
}
