import { afterEach, expect, test, vi } from "vitest";
import { apiGet } from "./client";

// This file runs in jsdom, so apiGet sees a browser. client.test.ts covers the server.

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

test("calls the same origin in the browser", async () => {
  vi.stubEnv("API_BASE_URL", "http://api.test");
  const fetchMock = vi.fn<typeof fetch>(
    async () => new Response("{}", { status: 200, headers: { "Content-Type": "application/json" } }),
  );
  vi.stubGlobal("fetch", fetchMock);

  await apiGet("/places/x");

  expect(fetchMock).toHaveBeenCalledWith("/api/v1/places/x", expect.anything());
});
