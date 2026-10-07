import { afterEach, expect, test, vi } from "vitest";
import { ApiError, apiGet } from "./client";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

function respondWith(status: number, body: string, contentType: string) {
  const fetchMock = vi.fn(async () => new Response(body, { status, headers: { "Content-Type": contentType } }));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

/** Returns the ApiError the call rejects with; fails if it resolves or rejects with anything else. */
async function rejection(call: Promise<unknown>): Promise<ApiError> {
  const error = await call.then(
    () => {
      throw new Error("expected the call to reject");
    },
    (reason: unknown) => reason,
  );
  expect(error).toBeInstanceOf(ApiError);
  return error as ApiError;
}

test("requests the versioned path on the configured base URL", async () => {
  vi.stubEnv("API_BASE_URL", "http://api.test");
  const fetchMock = respondWith(200, "{}", "application/json");

  await apiGet("/places/x");

  expect(fetchMock).toHaveBeenCalledWith(
    "http://api.test/api/v1/places/x",
    expect.objectContaining({ cache: "no-store" }),
  );
});

test("falls back to localhost when no base URL is set", async () => {
  vi.stubEnv("API_BASE_URL", "");
  const fetchMock = respondWith(200, "{}", "application/json");

  await apiGet("/places/x");

  expect(fetchMock).toHaveBeenCalledWith("http://localhost:8080/api/v1/places/x", expect.anything());
});

test("returns the parsed body on success", async () => {
  respondWith(200, '{"slug":"x"}', "application/json");

  await expect(apiGet("/places/x")).resolves.toEqual({ slug: "x" });
});

test("turns a problem detail into an ApiError", async () => {
  respondWith(
    404,
    '{"title":"Not Found","status":404,"detail":"Place not found.","code":"NOT_FOUND"}',
    "application/problem+json",
  );

  const error = await rejection(apiGet("/places/nope"));

  expect(error.status).toBe(404);
  expect(error.code).toBe("NOT_FOUND");
  expect(error.detail).toBe("Place not found.");
  expect(error.errors).toEqual([]);
});

test("keeps field errors", async () => {
  respondWith(
    400,
    '{"title":"Bad Request","status":400,"detail":"Validation failed.","code":"VALIDATION_FAILED","errors":[{"field":"size","message":"is required"}]}',
    "application/problem+json",
  );

  const error = await rejection(apiGet("/places"));

  expect(error.code).toBe("VALIDATION_FAILED");
  expect(error.errors).toEqual([{ field: "size", message: "is required" }]);
});

test("handles an error body that is not JSON", async () => {
  respondWith(400, "<!doctype html><html><head><title>HTTP Status 400</title></head></html>", "text/html");

  const error = await rejection(apiGet("/places/%zz"));

  expect(error.status).toBe(400);
  expect(error.code).toBe("UNKNOWN_ERROR");
});

test("handles a JSON error without a code", async () => {
  respondWith(500, '{"timestamp":"2026-10-07T10:52:19.452Z","status":999,"error":"None"}', "application/json");

  const error = await rejection(apiGet("/places/x"));

  expect(error.status).toBe(500);
  expect(error.code).toBe("UNKNOWN_ERROR");
});

test("does not trust a code it does not know", async () => {
  respondWith(418, '{"status":418,"detail":"x","code":"TEAPOT"}', "application/problem+json");

  const error = await rejection(apiGet("/places/x"));

  expect(error.code).toBe("UNKNOWN_ERROR");
});

test("turns a network failure into an ApiError", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => {
      throw new TypeError("fetch failed");
    }),
  );

  const error = await rejection(apiGet("/places/x"));

  expect(error.status).toBe(0);
  expect(error.code).toBe("NETWORK_ERROR");
});
