import type { TokenResponse } from "@queenstown/shared";
import { type NextRequest, NextResponse } from "next/server";
import { callBackend, relay, setSession } from "./server";

/**
 * The visitor's address as the proxy in front of this site (Caddy, Render) added it: the last entry
 * of X-Forwarded-For. Entries before it come from the visitor and could be anything. Null without a
 * proxy, as on a developer's machine.
 */
function visitorAddress(request: NextRequest): string | null {
  const entries = (request.headers.get("X-Forwarded-For") ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
  return entries.at(-1) ?? null;
}

/**
 * POST /api/auth/login and /api/auth/signup: the backend checks the email and password, the tokens
 * go into cookies, and the browser gets the account only. Errors pass through as Problem Details.
 */
export async function signIn(request: NextRequest, backendPath: "/auth/login" | "/auth/signup"): Promise<Response> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const visitor = visitorAddress(request);
  if (visitor) {
    // The backend limits tries per visitor; without this every visitor would be this server.
    headers["X-Forwarded-For"] = visitor;
  }
  const answer = await callBackend(backendPath, { method: "POST", headers, body: await request.text() });
  if (!answer.ok) {
    return relay(answer);
  }
  const tokens = (await answer.json()) as TokenResponse;
  const response = NextResponse.json({ user: tokens.user }, { status: answer.status });
  setSession(response, tokens);
  return response;
}
