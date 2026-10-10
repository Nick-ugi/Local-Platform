import { afterEach, expect, test, vi } from "vitest";
import { locate, wasLocationGranted } from "./location";

type Success = (position: { coords: { latitude: number; longitude: number } }) => void;
type Failure = (error: { code: number }) => void;

function stubNavigator(name: "geolocation" | "permissions", value: unknown) {
  Object.defineProperty(navigator, name, { value, configurable: true });
}

/** A browser whose geolocation answers with a position. */
function browserAt(latitude: number, longitude: number) {
  const getCurrentPosition = vi.fn((success: Success) => success({ coords: { latitude, longitude } }));
  stubNavigator("geolocation", { getCurrentPosition });
  return getCurrentPosition;
}

/** A browser whose geolocation fails with a GeolocationPositionError code. */
function browserFailingWith(code: number) {
  stubNavigator("geolocation", {
    getCurrentPosition: vi.fn((_success: Success, failure: Failure) => failure({ code })),
  });
}

function permissionIs(state: string) {
  stubNavigator("permissions", { query: vi.fn(async () => ({ state })) });
}

afterEach(() => {
  Reflect.deleteProperty(navigator, "geolocation");
  Reflect.deleteProperty(navigator, "permissions");
});

test("a position in Queenstown is inside", async () => {
  browserAt(-45.0322, 168.661);

  await expect(locate()).resolves.toEqual({
    status: "inside",
    position: { latitude: -45.0322, longitude: 168.661 },
  });
});

test("a position in Seoul is outside", async () => {
  browserAt(37.5665, 126.978);

  await expect(locate()).resolves.toEqual({
    status: "outside",
    position: { latitude: 37.5665, longitude: 126.978 },
  });
});

test("gives the browser ten seconds and accepts a position up to a minute old", async () => {
  const getCurrentPosition = browserAt(-45.0322, 168.661);

  await locate();

  expect(getCurrentPosition).toHaveBeenCalledWith(expect.any(Function), expect.any(Function), {
    timeout: 10_000,
    maximumAge: 60_000,
  });
});

test("a refused permission is denied", async () => {
  browserFailingWith(1);

  await expect(locate()).resolves.toEqual({ status: "denied" });
});

test.each([2, 3])("any other failure is unavailable: code %i", async (code) => {
  browserFailingWith(code);

  await expect(locate()).resolves.toEqual({ status: "unavailable" });
});

test("a browser without geolocation is unavailable", async () => {
  await expect(locate()).resolves.toEqual({ status: "unavailable" });
});

test("knows when permission was already granted", async () => {
  permissionIs("granted");

  await expect(wasLocationGranted()).resolves.toBe(true);
  expect(navigator.permissions.query).toHaveBeenCalledWith({ name: "geolocation" });
});

test.each(["prompt", "denied"])("permission in the state %s is not granted", async (state) => {
  permissionIs(state);

  await expect(wasLocationGranted()).resolves.toBe(false);
});

test("a failing permission query is not granted", async () => {
  stubNavigator("permissions", {
    query: vi.fn(async () => {
      throw new TypeError("geolocation is not a permission this browser knows");
    }),
  });

  await expect(wasLocationGranted()).resolves.toBe(false);
});

test("a browser without the Permissions API is not granted", async () => {
  await expect(wasLocationGranted()).resolves.toBe(false);
});
