import { type NextRequest, NextResponse } from "next/server";
import { callBackend, clearSession, readSession } from "@/lib/auth/server";

/** Log out (USER-02): the refresh token is revoked and both cookies are cleared, whatever happens. */
export async function POST(request: NextRequest): Promise<Response> {
  const { refresh } = readSession(request);
  if (refresh) {
    await callBackend("/auth/logout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: refresh }),
    });
  }
  const response = new NextResponse(null, { status: 204 });
  clearSession(response);
  return response;
}
