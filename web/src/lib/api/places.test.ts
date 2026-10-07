import type { PlaceDetail } from "@queenstown/shared";
import { beforeEach, expect, test, vi } from "vitest";
import { ApiError, apiGet } from "./client";
import { getPlace } from "./places";

// Keep the real ApiError; replace only the network call.
vi.mock("./client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./client")>()),
  apiGet: vi.fn(),
}));

const apiGetMock = vi.mocked(apiGet);

const place: PlaceDetail = {
  slug: "lakeside-kitchen",
  name: "Lakeside Kitchen",
  category: "food",
  subtype: null,
  address: "12 Beach Street, Queenstown",
  imageUrl: null,
  latitude: -45.0322,
  longitude: 168.661,
  description: null,
  openingHours: null,
  phone: null,
  website: null,
  source: "Business website",
  sourceUrl: "https://lakesidekitchen.example",
  updatedAt: "2026-10-02T01:30:00Z",
};

function apiError(status: number, code: ApiError["code"]) {
  return new ApiError({ status, code, detail: "x" });
}

beforeEach(() => {
  apiGetMock.mockReset();
});

test("returns the place", async () => {
  apiGetMock.mockResolvedValue(place);

  await expect(getPlace("lakeside-kitchen")).resolves.toEqual(place);
  expect(apiGetMock).toHaveBeenCalledWith("/places/lakeside-kitchen");
});

test("encodes the slug as one path segment", async () => {
  apiGetMock.mockResolvedValue(place);

  await getPlace("a/b c 한글");

  expect(apiGetMock).toHaveBeenCalledWith("/places/a%2Fb%20c%20%ED%95%9C%EA%B8%80");
});

test("returns null when the place is not found", async () => {
  apiGetMock.mockRejectedValue(apiError(404, "NOT_FOUND"));

  await expect(getPlace("nope")).resolves.toBeNull();
});

test("returns null when the server rejects the slug", async () => {
  apiGetMock.mockRejectedValue(apiError(400, "UNKNOWN_ERROR"));

  await expect(getPlace("%zz")).resolves.toBeNull();
});

test.each([
  [500, "INTERNAL_ERROR"],
  [0, "NETWORK_ERROR"],
] as const)("passes a %i %s error on", async (status, code) => {
  const error = apiError(status, code);
  apiGetMock.mockRejectedValue(error);

  await expect(getPlace("lakeside-kitchen")).rejects.toBe(error);
});
