import { ApiError, type AuthUser, type FavoritesResponse, requestJson, type TokenResponse } from "@queenstown/shared";
import * as SecureStore from "expo-secure-store";
import { apiBaseUrl } from "@/api/client";

// The visitor's sign-in on the phone (docs/06-api-specification.md, section 1): the refresh token
// is kept in the phone's secure storage, so the app stays signed in when it is closed; the access
// token lives only in memory and is renewed with it.

const REFRESH_KEY = "auth.refreshToken";

type Session = { accessToken: string; user: AuthUser };

let session: Session | null = null;
let refreshing: Promise<Session | null> | null = null;
const listeners = new Set<(user: AuthUser | null) => void>();

function url(path: string) {
  return `${apiBaseUrl()}/api/v1${path}`;
}

function post<T>(path: string, body: unknown): Promise<T> {
  return requestJson<T>(url(path), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function store(tokens: TokenResponse | null) {
  session = tokens ? { accessToken: tokens.accessToken, user: tokens.user } : null;
  try {
    if (tokens) {
      await SecureStore.setItemAsync(REFRESH_KEY, tokens.refreshToken);
    } else {
      await SecureStore.deleteItemAsync(REFRESH_KEY);
    }
  } catch {
    // Without secure storage the app stays signed in until it is closed.
  }
  for (const listener of listeners) {
    listener(session?.user ?? null);
  }
}

async function readRefreshToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(REFRESH_KEY);
  } catch {
    return null;
  }
}

/** Tells the caller whenever the visitor signs in or out, including a session that ran out. */
export function onSessionChange(listener: (user: AuthUser | null) => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export async function login(email: string, password: string): Promise<AuthUser> {
  const tokens = await post<TokenResponse>("/auth/login", { email, password });
  await store(tokens);
  return tokens.user;
}

export async function signup(email: string, password: string): Promise<AuthUser> {
  const tokens = await post<TokenResponse>("/auth/signup", { email, password });
  await store(tokens);
  return tokens.user;
}

/** New tokens from the stored refresh token. Callers at the same time share one request. */
function refresh(): Promise<Session | null> {
  refreshing ??= (async () => {
    const refreshToken = await readRefreshToken();
    if (refreshToken === null) {
      return null;
    }
    try {
      await store(await post<TokenResponse>("/auth/refresh", { refreshToken }));
      return session;
    } catch (error) {
      // Only a refused token ends the session; without a network it can be tried again later.
      if (error instanceof ApiError && error.status === 401) {
        await store(null);
      }
      return null;
    }
  })().finally(() => {
    refreshing = null;
  });
  return refreshing;
}

/** The signed-in visitor when the app starts, from the stored refresh token, or null. */
export async function restore(): Promise<AuthUser | null> {
  return session?.user ?? (await refresh())?.user ?? null;
}

export async function logout(): Promise<void> {
  const refreshToken = await readRefreshToken();
  await store(null);
  if (refreshToken !== null) {
    await post("/auth/logout", { refreshToken }).catch(() => undefined);
  }
}

/**
 * Calls /me as the signed-in visitor. An access token that ran out (15 minutes) is renewed once and
 * the call sent again. Rejects with a 401 ApiError when nobody is signed in.
 */
async function meRequest<T>(method: "GET" | "PUT" | "DELETE", path: string): Promise<T> {
  const send = (current: Session) =>
    requestJson<T>(url(`/me${path}`), { method, headers: { Authorization: `Bearer ${current.accessToken}` } });

  const current = session ?? (await refresh());
  if (current === null) {
    throw new ApiError({ status: 401, code: "UNAUTHORIZED", detail: "Sign in to continue." });
  }
  try {
    return await send(current);
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 401) {
      throw error;
    }
    const renewed = await refresh();
    if (renewed === null) {
      throw error;
    }
    return send(renewed);
  }
}

export function getFavorites(): Promise<FavoritesResponse> {
  return meRequest("GET", "/favorites");
}

export function saveFavorite(slug: string): Promise<void> {
  return meRequest("PUT", `/favorites/${encodeURIComponent(slug)}`);
}

export function removeFavorite(slug: string): Promise<void> {
  return meRequest("DELETE", `/favorites/${encodeURIComponent(slug)}`);
}

/** For tests: forgets the session in memory, as closing the app does. */
export function resetForTests() {
  session = null;
  refreshing = null;
  listeners.clear();
}
