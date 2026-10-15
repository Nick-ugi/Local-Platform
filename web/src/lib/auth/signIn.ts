import type { TokenResponse } from "@queenstown/shared";
import { type NextRequest, NextResponse } from "next/server";
import { callBackend, relay, setSession } from "./server";

/**
 * POST /api/auth/login and /api/auth/signup: the backend checks the email and password, the tokens
 * go into cookies, and the browser gets the account only. Errors pass through as Problem Details.
 */
export async function signIn(request: NextRequest, backendPath: "/auth/login" | "/auth/signup"): Promise<Response> {
  const answer = await callBackend(backendPath, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: await request.text(),
  });
  if (!answer.ok) {
    return relay(answer);
  }
  const tokens = (await answer.json()) as TokenResponse;
  const response = NextResponse.json({ user: tokens.user }, { status: answer.status });
  setSession(response, tokens);
  return response;
}
