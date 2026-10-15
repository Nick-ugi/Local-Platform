import type { TokenResponse } from "@queenstown/shared";
import { type NextRequest, NextResponse } from "next/server";
import { callBackend, clearSession, readSession, refreshTokens, relay, setSession } from "@/lib/auth/server";

/**
 * /api/v1/me/** for the browser: sent to the backend with the access token from the cookie. A
 * token that ran out (15 minutes) is renewed with the refresh token once and the call sent again,
 * and the new tokens replace the cookies. When the visitor cannot be signed in, the answer is the
 * backend's 401 and the cookies are cleared.
 */
async function forward(request: NextRequest, method: "GET" | "PUT" | "DELETE"): Promise<Response> {
  const { pathname, search } = new URL(request.url);
  const path = `${pathname.slice("/api/v1".length)}${search}`;
  const session = readSession(request);

  let renewed: TokenResponse | null = null;
  let access = session.access;
  if (access === null && session.refresh !== null) {
    renewed = await refreshTokens(session.refresh);
    access = renewed?.accessToken ?? null;
  }

  const send = (token: string | null) =>
    callBackend(path, { method, headers: token ? { Authorization: `Bearer ${token}` } : {} });

  let answer = await send(access);
  if (answer.status === 401 && renewed === null && session.refresh !== null && access !== null) {
    renewed = await refreshTokens(session.refresh);
    if (renewed !== null) {
      answer = await send(renewed.accessToken);
    }
  }

  const response = await relay(answer);
  const next = new NextResponse(response.body, { status: response.status, headers: response.headers });
  if (renewed !== null) {
    setSession(next, renewed);
  } else if (answer.status === 401 && (session.access !== null || session.refresh !== null)) {
    clearSession(next);
  }
  return next;
}

export function GET(request: NextRequest) {
  return forward(request, "GET");
}

export function PUT(request: NextRequest) {
  return forward(request, "PUT");
}

export function DELETE(request: NextRequest) {
  return forward(request, "DELETE");
}
