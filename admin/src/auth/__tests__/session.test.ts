import { ApiError } from "@queenstown/shared";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { fakeApi, tokens, unauthorized } from "@/test/fakeApi";
import { adminRequest, login, logout, NotAdminError, onSessionChange, resetForTests, restore } from "../session";

beforeEach(() => resetForTests());
afterEach(() => vi.unstubAllGlobals());

test("an admin signs in and calls the admin API with the access token", async () => {
  const calls = fakeApi(({ path }) =>
    path === "/api/v1/auth/login" ? { status: 200, body: tokens("admin") } : { status: 200, body: { items: [] } },
  );

  await expect(login("admin@example.com", "secret password")).resolves.toEqual({
    email: "admin@example.com",
    role: "admin",
  });
  await adminRequest("GET", "/places");

  expect(calls[0]).toMatchObject({ method: "POST", body: { email: "admin@example.com", password: "secret password" } });
  expect(calls[1]).toMatchObject({ method: "GET", path: "/api/v1/admin/places", auth: "Bearer access-1" });
  expect(sessionStorage.getItem("admin.refreshToken")).toBe("refresh-1");
});

test("an account that is not an admin is refused and signed out again", async () => {
  const calls = fakeApi(({ path }) =>
    path === "/api/v1/auth/login" ? { status: 200, body: tokens("user") } : { status: 204 },
  );

  await expect(login("user@example.com", "secret password")).rejects.toBeInstanceOf(NotAdminError);

  expect(calls[1]).toMatchObject({ path: "/api/v1/auth/logout", body: { refreshToken: "refresh-1" } });
  expect(sessionStorage.getItem("admin.refreshToken")).toBeNull();
});

test("a reload signs in again from the stored refresh token", async () => {
  sessionStorage.setItem("admin.refreshToken", "refresh-0");
  const calls = fakeApi(() => ({ status: 200, body: tokens("admin", 1) }));

  await expect(restore()).resolves.toMatchObject({ role: "admin" });

  expect(calls[0]).toMatchObject({ path: "/api/v1/auth/refresh", body: { refreshToken: "refresh-0" } });
  expect(sessionStorage.getItem("admin.refreshToken")).toBe("refresh-1");
});

test("without a stored token there is nobody to restore", async () => {
  const calls = fakeApi(() => ({ status: 500 }));

  await expect(restore()).resolves.toBeNull();
  expect(calls).toHaveLength(0);
});

test("an access token that ran out is renewed once and the call sent again", async () => {
  let refreshed = false;
  const calls = fakeApi(({ path, auth }) => {
    if (path === "/api/v1/auth/login") return { status: 200, body: tokens("admin", 1) };
    if (path === "/api/v1/auth/refresh") {
      refreshed = true;
      return { status: 200, body: tokens("admin", 2) };
    }
    return auth === "Bearer access-2" ? { status: 200, body: { ok: true } } : unauthorized;
  });
  await login("admin@example.com", "secret password");

  await expect(adminRequest("GET", "/places")).resolves.toEqual({ ok: true });

  expect(refreshed).toBe(true);
  expect(calls.map((call) => call.path)).toEqual([
    "/api/v1/auth/login",
    "/api/v1/admin/places",
    "/api/v1/auth/refresh",
    "/api/v1/admin/places",
  ]);
});

test("a refused refresh ends the session and says so", async () => {
  fakeApi(({ path }) => (path === "/api/v1/auth/login" ? { status: 200, body: tokens("admin") } : unauthorized));
  await login("admin@example.com", "secret password");
  const changes: unknown[] = [];
  onSessionChange((user) => changes.push(user));

  await expect(adminRequest("GET", "/places")).rejects.toBeInstanceOf(ApiError);

  expect(changes).toEqual([null]);
  expect(sessionStorage.getItem("admin.refreshToken")).toBeNull();
});

test("logout forgets the tokens and revokes the refresh token", async () => {
  const calls = fakeApi(({ path }) =>
    path === "/api/v1/auth/login" ? { status: 200, body: tokens("admin") } : { status: 204 },
  );
  await login("admin@example.com", "secret password");

  await logout();

  expect(calls[1]).toMatchObject({ path: "/api/v1/auth/logout", body: { refreshToken: "refresh-1" } });
  await expect(restore()).resolves.toBeNull();
});
