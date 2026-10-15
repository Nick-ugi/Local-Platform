import type { TokenResponse } from "@queenstown/shared";
import type { NextRequest, NextResponse } from "next/server";
import { backendBaseUrl } from "@/lib/api/client";

// The visitor's tokens live in HttpOnly cookies that only this server reads
// (docs/06-api-specification.md, section 1): the browser's JavaScript never sees them. The
// browser calls this site, and these helpers call the backend with the token.

export const ACCESS_COOKIE = "ql_access";
export const REFRESH_COOKIE = "ql_refresh";

/**
 * Says only that a session exists, for the browser: it holds no token and is not HttpOnly. Pages
 * read it to skip asking /api/v1/me for a visitor who has never signed in (lib/auth/account.ts).
 */
export const SIGNED_IN_COOKIE = "ql_signed_in";

/** How long the refresh cookie lasts: the refresh token's own 30 days. */
const REFRESH_SECONDS = 30 * 24 * 60 * 60;

function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    // Plain http on a developer's machine; https everywhere else.
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  };
}

export function setSession(response: NextResponse, tokens: TokenResponse) {
  response.cookies.set(ACCESS_COOKIE, tokens.accessToken, cookieOptions(tokens.expiresIn));
  response.cookies.set(REFRESH_COOKIE, tokens.refreshToken, cookieOptions(REFRESH_SECONDS));
  response.cookies.set(SIGNED_IN_COOKIE, "1", { ...cookieOptions(REFRESH_SECONDS), httpOnly: false });
}

export function clearSession(response: NextResponse) {
  response.cookies.set(ACCESS_COOKIE, "", cookieOptions(0));
  response.cookies.set(REFRESH_COOKIE, "", cookieOptions(0));
  response.cookies.set(SIGNED_IN_COOKIE, "", { ...cookieOptions(0), httpOnly: false });
}

export function readSession(request: NextRequest): { access: string | null; refresh: string | null } {
  return {
    access: request.cookies.get(ACCESS_COOKIE)?.value || null,
    refresh: request.cookies.get(REFRESH_COOKIE)?.value || null,
  };
}

/** Calls the backend's /api/v1{path}. Never throws: an unreachable backend is a 502 Response. */
export async function callBackend(path: string, init: RequestInit = {}): Promise<Response> {
  try {
    return await fetch(`${backendBaseUrl()}/api/v1${path}`, { ...init, cache: "no-store" });
  } catch (cause) {
    console.error("The backend could not be reached.", cause);
    return Response.json(
      { title: "Bad Gateway", status: 502, detail: "The API could not be reached.", code: "INTERNAL_ERROR" },
      { status: 502, headers: { "Content-Type": "application/problem+json" } },
    );
  }
}

/** New tokens for a refresh token, or null when the backend refuses it or cannot be reached. */
export async function refreshTokens(refreshToken: string): Promise<TokenResponse | null> {
  const answer = await callBackend("/auth/refresh", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });
  return answer.ok ? ((await answer.json()) as TokenResponse) : null;
}

/** The backend's answer with its status, body and type, for the browser. */
export async function relay(answer: Response): Promise<Response> {
  const headers = new Headers();
  const contentType = answer.headers.get("Content-Type");
  if (contentType) {
    headers.set("Content-Type", contentType);
  }
  const body = answer.status === 204 ? null : await answer.arrayBuffer();
  return new Response(body, { status: answer.status, headers });
}
