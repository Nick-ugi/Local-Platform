// @vitest-environment node
import { NextRequest } from "next/server";
import { afterEach, expect, test, vi } from "vitest";
import { POST as login } from "@/app/api/auth/login/route";
import { POST as logout } from "@/app/api/auth/logout/route";
import { DELETE as removeFavorite, GET as getMe } from "@/app/api/v1/me/[[...path]]/route";
import { loginPath, safeNext } from "./next";

type Call = { url: string; method: string; auth: string | null; body: string | null };

/** The backend: each call goes to `answer`; the calls are kept. */
function backend(answer: (call: Call) => Response) {
  const calls: Call[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init: RequestInit = {}) => {
      const call = {
        url,
        method: init.method ?? "GET",
        auth: new Headers(init.headers).get("Authorization"),
        body: typeof init.body === "string" ? init.body : null,
      };
      calls.push(call);
      return answer(call);
    }),
  );
  return calls;
}

const tokens = (n: number) => ({
  accessToken: `access-${n}`,
  refreshToken: `refresh-${n}`,
  expiresIn: 900,
  user: { email: "kiri@example.com", role: "user" },
});

function request(path: string, init: { method?: string; body?: string; cookies?: Record<string, string> } = {}) {
  const headers = new Headers();
  if (init.cookies) {
    headers.set(
      "Cookie",
      Object.entries(init.cookies)
        .map(([name, value]) => `${name}=${value}`)
        .join("; "),
    );
  }
  return new NextRequest(`http://localhost:3001${path}`, { method: init.method ?? "GET", body: init.body, headers });
}

/** The cookies a response sets, by name, with their attributes. */
function setCookies(response: Response): Record<string, string> {
  return Object.fromEntries(
    response.headers.getSetCookie().map((cookie) => [cookie.split("=")[0], cookie]),
  );
}

afterEach(() => vi.unstubAllGlobals());

test("login keeps the tokens in HttpOnly cookies and gives the browser only the account", async () => {
  const calls = backend(() => Response.json(tokens(1)));

  const response = await login(
    request("/api/auth/login", { method: "POST", body: '{"email":"kiri@example.com","password":"x"}' }),
  );

  expect(calls[0]).toMatchObject({ url: "http://localhost:8080/api/v1/auth/login", method: "POST" });
  expect(await response.json()).toEqual({ user: { email: "kiri@example.com", role: "user" } });
  const cookies = setCookies(response);
  expect(cookies.ql_access).toMatch(/^ql_access=access-1;/);
  expect(cookies.ql_access).toMatch(/HttpOnly/i);
  expect(cookies.ql_access).toMatch(/SameSite=lax/i);
  expect(cookies.ql_refresh).toMatch(/Max-Age=2592000/);
  // Only says that there is a session, for the page; readable, and holding no token.
  expect(cookies.ql_signed_in).toMatch(/^ql_signed_in=1;/);
  expect(cookies.ql_signed_in).not.toMatch(/HttpOnly/i);
});

test("a refused login passes the backend's error through and sets nothing", async () => {
  backend(() =>
    Response.json({ code: "INVALID_CREDENTIALS", detail: "The email or password is wrong.", status: 401 }, { status: 401 }),
  );

  const response = await login(request("/api/auth/login", { method: "POST", body: "{}" }));

  expect(response.status).toBe(401);
  expect(await response.json()).toMatchObject({ code: "INVALID_CREDENTIALS" });
  expect(response.headers.getSetCookie()).toEqual([]);
});

test("/me goes to the backend with the access token from the cookie", async () => {
  const calls = backend(() => Response.json({ email: "kiri@example.com", role: "user" }));

  const response = await getMe(request("/api/v1/me", { cookies: { ql_access: "access-1", ql_refresh: "refresh-1" } }));

  expect(response.status).toBe(200);
  expect(calls).toEqual([{ url: "http://localhost:8080/api/v1/me", method: "GET", auth: "Bearer access-1", body: null }]);
});

test("a token that ran out is renewed once, the call sent again and the cookies replaced", async () => {
  const calls = backend((call) => {
    if (call.url.endsWith("/auth/refresh")) return Response.json(tokens(2));
    return call.auth === "Bearer access-2" ? new Response(null, { status: 204 }) : Response.json({}, { status: 401 });
  });

  const response = await removeFavorite(
    request("/api/v1/me/favorites/harbour-coffee", {
      method: "DELETE",
      cookies: { ql_access: "access-1", ql_refresh: "refresh-1" },
    }),
  );

  expect(response.status).toBe(204);
  expect(calls.map((call) => `${call.method} ${call.url.replace("http://localhost:8080/api/v1", "")}`)).toEqual([
    "DELETE /me/favorites/harbour-coffee",
    "POST /auth/refresh",
    "DELETE /me/favorites/harbour-coffee",
  ]);
  expect(JSON.parse(calls[1].body ?? "")).toEqual({ refreshToken: "refresh-1" });
  expect(setCookies(response).ql_access).toMatch(/^ql_access=access-2;/);
});

test("with only a refresh cookie the tokens are renewed first", async () => {
  const calls = backend((call) =>
    call.url.endsWith("/auth/refresh") ? Response.json(tokens(2)) : Response.json({ items: [] }),
  );

  const response = await getMe(request("/api/v1/me/favorites", { cookies: { ql_refresh: "refresh-1" } }));

  expect(response.status).toBe(200);
  expect(calls[1].auth).toBe("Bearer access-2");
});

test("a visitor who cannot be signed in gets the 401 and loses the cookies", async () => {
  backend(() => Response.json({ code: "UNAUTHORIZED", status: 401, detail: "Sign in to continue." }, { status: 401 }));

  const response = await getMe(request("/api/v1/me", { cookies: { ql_access: "old", ql_refresh: "revoked" } }));

  expect(response.status).toBe(401);
  expect(setCookies(response).ql_refresh).toMatch(/Max-Age=0/);
});

test("logout revokes the refresh token and clears the cookies", async () => {
  const calls = backend(() => new Response(null, { status: 204 }));

  const response = await logout(request("/api/auth/logout", { method: "POST", cookies: { ql_refresh: "refresh-1" } }));

  expect(response.status).toBe(204);
  expect(JSON.parse(calls[0].body ?? "")).toEqual({ refreshToken: "refresh-1" });
  expect(setCookies(response).ql_access).toMatch(/Max-Age=0/);
});

test("after login the visitor goes back only to a path on this site", () => {
  expect(safeNext("/places/harbour-coffee?favorite=1")).toBe("/places/harbour-coffee?favorite=1");
  expect(safeNext("//evil.example")).toBe("/");
  expect(safeNext("/\\evil.example")).toBe("/");
  expect(safeNext("https://evil.example")).toBe("/");
  expect(safeNext(null)).toBe("/");
  expect(loginPath("/places/a?favorite=1")).toBe("/login?next=%2Fplaces%2Fa%3Ffavorite%3D1");
});
