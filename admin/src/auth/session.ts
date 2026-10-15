import { ApiError, type AuthUser, requestJson, type TokenResponse } from "@queenstown/shared";

// The admin's sign-in (docs/06-api-specification.md, section 1). The access token lives only in
// memory. The refresh token is kept in sessionStorage, so a reload keeps the admin signed in and
// closing the tab ends it. Every call goes to /api on the admin's own origin (vite.config.ts).

const REFRESH_KEY = "admin.refreshToken";

type Session = { accessToken: string; user: AuthUser };

let session: Session | null = null;
let refreshing: Promise<Session | null> | null = null;
const listeners = new Set<(user: AuthUser | null) => void>();

/** Thrown by login() for an account that is not an admin. */
export class NotAdminError extends Error {
  constructor() {
    super("This account is not an admin.");
    this.name = "NotAdminError";
  }
}

function readRefreshToken(): string | null {
  try {
    return sessionStorage.getItem(REFRESH_KEY);
  } catch {
    return null;
  }
}

function store(tokens: TokenResponse | null) {
  session = tokens ? { accessToken: tokens.accessToken, user: tokens.user } : null;
  try {
    if (tokens) {
      sessionStorage.setItem(REFRESH_KEY, tokens.refreshToken);
    } else {
      sessionStorage.removeItem(REFRESH_KEY);
    }
  } catch {
    // Without storage the admin stays signed in until the page is reloaded.
  }
  for (const listener of listeners) {
    listener(session?.user ?? null);
  }
}

function post<T>(path: string, body: unknown): Promise<T> {
  return requestJson<T>(`/api/v1${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

/** Tells the caller whenever the admin signs in or out, including a session that ran out. */
export function onSessionChange(listener: (user: AuthUser | null) => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * Signs in. The API signs in any account (ADMIN-01, docs/06-api-specification.md section 8), so an
 * account that is not an admin is signed out again at once and refused.
 */
export async function login(email: string, password: string): Promise<AuthUser> {
  const tokens = await post<TokenResponse>("/auth/login", { email, password });
  if (tokens.user.role !== "admin") {
    await post("/auth/logout", { refreshToken: tokens.refreshToken }).catch(() => undefined);
    throw new NotAdminError();
  }
  store(tokens);
  return tokens.user;
}

/** Trades the stored refresh token for new tokens. Callers at the same time share one request. */
function refresh(): Promise<Session | null> {
  const refreshToken = readRefreshToken();
  if (refreshToken === null) {
    return Promise.resolve(null);
  }
  refreshing ??= post<TokenResponse>("/auth/refresh", { refreshToken })
    .then(
      (tokens) => {
        // An account that lost the admin role since is no longer let in.
        store(tokens.user.role === "admin" ? tokens : null);
        return session;
      },
      (error: unknown) => {
        // Only a refused token ends the session; a network failure leaves it to try again.
        if (error instanceof ApiError && error.status === 401) {
          store(null);
        }
        return null;
      },
    )
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
}

/** The signed-in admin after a reload, from the stored refresh token, or null. */
export async function restore(): Promise<AuthUser | null> {
  return session?.user ?? (await refresh())?.user ?? null;
}

export async function logout(): Promise<void> {
  const refreshToken = readRefreshToken();
  store(null);
  if (refreshToken !== null) {
    await post("/auth/logout", { refreshToken }).catch(() => undefined);
  }
}

/**
 * Calls the admin API as the signed-in admin. An access token that has run out (15 minutes) is
 * renewed once and the call is sent again; when the renewal is refused the session ends.
 */
export async function adminRequest<T>(method: "GET" | "POST" | "PUT", path: string, body?: unknown): Promise<T> {
  const send = (current: Session) =>
    requestJson<T>(`/api/v1/admin${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${current.accessToken}`,
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });

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
    // refresh() ends the session itself when the token is refused.
    const renewed = await refresh();
    if (renewed === null) {
      throw error;
    }
    return send(renewed);
  }
}

/** For tests: forgets the session held in memory, as a reload does. */
export function resetForTests() {
  session = null;
  refreshing = null;
  listeners.clear();
}
