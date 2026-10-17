import { ApiError, type AuthUser, type FavoritesResponse, requestJson } from "@queenstown/shared";

// The visitor's account, from the browser. Every call goes to this site: /api/auth/* and
// /api/v1/me/* hold the tokens in HttpOnly cookies and call the backend (lib/auth/server.ts).

function post<T>(path: string, body?: unknown): Promise<T> {
  return requestJson<T>(path, {
    method: "POST",
    headers: body === undefined ? {} : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

/**
 * True when this browser may have a session: the server sets a plain "ql_signed_in" cookie beside
 * the HttpOnly tokens (lib/auth/server.ts). Without it there is nothing to ask the server about.
 */
export function mayBeSignedIn(): boolean {
  return typeof document !== "undefined" && /(?:^|;\s*)ql_signed_in=1(?:;|$)/.test(document.cookie);
}

/** The signed-in account, or null for a visitor who is not signed in. */
export async function getAccount(): Promise<AuthUser | null> {
  if (!mayBeSignedIn()) {
    return null;
  }
  try {
    return await requestJson<AuthUser>("/api/v1/me", { cache: "no-store" });
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      return null;
    }
    throw error;
  }
}

export async function logIn(email: string, password: string): Promise<AuthUser> {
  return (await post<{ user: AuthUser }>("/api/auth/login", { email, password })).user;
}

export async function signUp(email: string, password: string): Promise<AuthUser> {
  return (await post<{ user: AuthUser }>("/api/auth/signup", { email, password })).user;
}

export async function logOut(): Promise<void> {
  await post("/api/auth/logout");
}

/** The saved places, or null for a visitor who is not signed in. */
export async function getFavorites(): Promise<FavoritesResponse | null> {
  if (!mayBeSignedIn()) {
    return null;
  }
  try {
    return await requestJson<FavoritesResponse>("/api/v1/me/favorites", { cache: "no-store" });
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      return null;
    }
    throw error;
  }
}

export function saveFavorite(slug: string): Promise<void> {
  return requestJson(`/api/v1/me/favorites/${encodeURIComponent(slug)}`, { method: "PUT" });
}

export function removeFavorite(slug: string): Promise<void> {
  return requestJson(`/api/v1/me/favorites/${encodeURIComponent(slug)}`, { method: "DELETE" });
}
