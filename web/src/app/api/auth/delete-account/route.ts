import type { TokenResponse } from "@queenstown/shared";
import { type NextRequest, NextResponse } from "next/server";
import { callBackend, clearSession, readSession, refreshTokens, relay } from "@/lib/auth/server";
import { visitorAddress } from "@/lib/auth/signIn";

/**
 * Deletes the signed-in account (DELETE /me, which Google Play asks of apps with sign up): the
 * password goes to the backend with the access token from the cookie, renewed first if it ran out.
 * Once the account is gone the cookies are cleared. The backend's refusals pass through: a wrong
 * password (403) keeps the session.
 */
export async function POST(request: NextRequest): Promise<Response> {
  const session = readSession(request);
  const body = await request.text();
  const visitor = visitorAddress(request);

  let renewed: TokenResponse | null = null;
  let access = session.access;
  if (access === null && session.refresh !== null) {
    renewed = await refreshTokens(session.refresh);
    access = renewed?.accessToken ?? null;
  }
  if (access === null) {
    const refused = NextResponse.json(
      { title: "Unauthorized", status: 401, detail: "Sign in to continue.", code: "UNAUTHORIZED" },
      { status: 401, headers: { "Content-Type": "application/problem+json" } },
    );
    clearSession(refused);
    return refused;
  }

  const send = (token: string) => {
    const headers: Record<string, string> = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
    if (visitor) {
      // The backend limits tries per visitor, as for log in.
      headers["X-Forwarded-For"] = visitor;
    }
    return callBackend("/me", { method: "DELETE", headers, body });
  };

  let answer = await send(access);
  if (answer.status === 401 && renewed === null && session.refresh !== null) {
    renewed = await refreshTokens(session.refresh);
    if (renewed !== null) {
      answer = await send(renewed.accessToken);
    }
  }

  if (answer.status === 204) {
    const deleted = new NextResponse(null, { status: 204 });
    clearSession(deleted);
    return deleted;
  }
  const response = await relay(answer);
  const next = new NextResponse(response.body, { status: response.status, headers: response.headers });
  if (answer.status === 401) {
    clearSession(next);
  }
  return next;
}
