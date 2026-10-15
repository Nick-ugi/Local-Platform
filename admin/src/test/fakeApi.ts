import { vi } from "vitest";

type Handler = (request: { method: string; path: string; body: unknown; auth: string | null }) => {
  status: number;
  body?: unknown;
};

/**
 * Replaces fetch with a fake API. Each call goes to the handler with its method, path (with the
 * query), JSON body and Authorization header; the calls are kept for the test to read.
 */
export function fakeApi(handler: Handler) {
  const calls: { method: string; path: string; body: unknown; auth: string | null }[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init: RequestInit = {}) => {
      const headers = new Headers(init.headers);
      const request = {
        method: init.method ?? "GET",
        path: url,
        body: typeof init.body === "string" ? JSON.parse(init.body) : undefined,
        auth: headers.get("Authorization"),
      };
      calls.push(request);
      const answer = handler(request);
      return new Response(answer.body === undefined ? null : JSON.stringify(answer.body), {
        status: answer.status,
        headers: { "Content-Type": answer.status >= 400 ? "application/problem+json" : "application/json" },
      });
    }),
  );
  return calls;
}

export function tokens(role: "admin" | "user", n = 1) {
  return {
    accessToken: `access-${n}`,
    refreshToken: `refresh-${n}`,
    expiresIn: 900,
    user: { email: `${role}@example.com`, role },
  };
}

export const unauthorized = { status: 401, body: { code: "UNAUTHORIZED", detail: "Sign in to continue.", status: 401 } };
