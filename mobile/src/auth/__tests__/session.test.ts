import { ApiError } from "@queenstown/shared";
import * as SecureStore from "expo-secure-store";
import { getFavorites, login, logout, resetForTests, restore, saveFavorite, signup } from "../session";

const items = (SecureStore as unknown as { __items: Map<string, string> }).__items;
const fetchMock = jest.fn();

type Call = { method: string; url: string; auth: string | null; body: unknown };
let calls: Call[] = [];

function api(answer: (call: Call) => { status: number; body?: unknown }) {
  fetchMock.mockImplementation(async (url: string, init: RequestInit = {}) => {
    const call = {
      method: init.method ?? "GET",
      url: url.replace("http://10.0.2.2:8080/api/v1", ""),
      auth: (init.headers as Record<string, string> | undefined)?.Authorization ?? null,
      body: typeof init.body === "string" ? JSON.parse(init.body) : undefined,
    };
    calls.push(call);
    const { status, body } = answer(call);
    return {
      ok: status >= 200 && status < 300,
      status,
      json: async () => body,
      text: async () => JSON.stringify(body ?? ""),
    };
  });
}

const tokens = (n: number) => ({
  accessToken: `access-${n}`,
  refreshToken: `refresh-${n}`,
  expiresIn: 900,
  user: { email: "kiri@example.com", role: "user" },
});

beforeEach(() => {
  resetForTests();
  items.clear();
  calls = [];
  fetchMock.mockReset();
  globalThis.fetch = fetchMock;
  delete process.env.EXPO_PUBLIC_API_BASE_URL;
});

test("logging in keeps the refresh token in secure storage and calls /me with the access token", async () => {
  api(({ url }) => (url === "/auth/login" ? { status: 200, body: tokens(1) } : { status: 200, body: { items: [] } }));

  await expect(login("kiri@example.com", "correct horse")).resolves.toEqual({ email: "kiri@example.com", role: "user" });
  await getFavorites();

  expect(items.get("auth.refreshToken")).toBe("refresh-1");
  expect(calls[1]).toMatchObject({ method: "GET", url: "/me/favorites", auth: "Bearer access-1" });
});

test("sign up signs in at once", async () => {
  api(() => ({ status: 201, body: tokens(1) }));

  await signup("kiri@example.com", "correct horse");

  expect(calls[0]).toMatchObject({ method: "POST", url: "/auth/signup" });
  expect(items.get("auth.refreshToken")).toBe("refresh-1");
});

test("the app starts signed in from the stored refresh token", async () => {
  items.set("auth.refreshToken", "refresh-0");
  api(() => ({ status: 200, body: tokens(1) }));

  await expect(restore()).resolves.toMatchObject({ email: "kiri@example.com" });

  expect(calls[0]).toMatchObject({ url: "/auth/refresh", body: { refreshToken: "refresh-0" } });
  expect(items.get("auth.refreshToken")).toBe("refresh-1");
});

test("an access token that ran out is renewed once and the call sent again", async () => {
  api(({ url, auth }) => {
    if (url === "/auth/login") return { status: 200, body: tokens(1) };
    if (url === "/auth/refresh") return { status: 200, body: tokens(2) };
    return auth === "Bearer access-2" ? { status: 204 } : { status: 401, body: { code: "UNAUTHORIZED", detail: "x" } };
  });
  await login("kiri@example.com", "correct horse");

  await saveFavorite("harbour-coffee");

  expect(calls.map((call) => `${call.method} ${call.url}`)).toEqual([
    "POST /auth/login",
    "PUT /me/favorites/harbour-coffee",
    "POST /auth/refresh",
    "PUT /me/favorites/harbour-coffee",
  ]);
});

test("nobody signed in is a 401, without asking the server", async () => {
  api(() => ({ status: 500 }));

  await expect(getFavorites()).rejects.toMatchObject({ status: 401 });
  expect(calls).toHaveLength(0);
});

test("a refused refresh token ends the session", async () => {
  items.set("auth.refreshToken", "revoked");
  api(() => ({ status: 401, body: { code: "INVALID_REFRESH_TOKEN", detail: "x" } }));

  await expect(restore()).resolves.toBeNull();
  expect(items.has("auth.refreshToken")).toBe(false);
});

test("without a network the stored session is kept for later", async () => {
  items.set("auth.refreshToken", "refresh-0");
  fetchMock.mockRejectedValue(new TypeError("Network request failed"));

  await expect(restore()).resolves.toBeNull();
  expect(items.get("auth.refreshToken")).toBe("refresh-0");
});

test("logout revokes the refresh token and forgets it", async () => {
  api(({ url }) => (url === "/auth/login" ? { status: 200, body: tokens(1) } : { status: 204 }));
  await login("kiri@example.com", "correct horse");

  await logout();

  expect(calls[1]).toMatchObject({ url: "/auth/logout", body: { refreshToken: "refresh-1" } });
  expect(items.has("auth.refreshToken")).toBe(false);
  await expect(getFavorites()).rejects.toBeInstanceOf(ApiError);
});
