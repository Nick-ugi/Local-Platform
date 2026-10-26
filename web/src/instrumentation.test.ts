import { afterEach, expect, test, vi } from "vitest";
import { register } from "./instrumentation";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

test("the Node server starts waking the backend as it starts, without waiting for it", async () => {
  vi.stubEnv("NEXT_RUNTIME", "nodejs");
  vi.stubEnv("API_BASE_URL", "http://api.internal:8080");
  // A backend that takes its time: register must not wait for it.
  const fetchFn = vi.fn<typeof fetch>(() => new Promise<Response>(() => {}));
  vi.stubGlobal("fetch", fetchFn);

  await register();

  expect(fetchFn).toHaveBeenCalledTimes(1);
  expect(fetchFn.mock.calls[0][0]).toBe("http://api.internal:8080/actuator/health");
});

test("the edge runtime leaves the backend alone", async () => {
  vi.stubEnv("NEXT_RUNTIME", "edge");
  const fetchFn = vi.fn();
  vi.stubGlobal("fetch", fetchFn);

  await register();

  expect(fetchFn).not.toHaveBeenCalled();
});
