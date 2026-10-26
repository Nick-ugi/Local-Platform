import { expect, test, vi } from "vitest";
import { wakeBackend } from "./wake";

test("asks the backend's health once", async () => {
  const fetchFn = vi.fn<typeof fetch>(async () => new Response("{}"));

  await wakeBackend(fetchFn, "http://api.internal:8080/");

  expect(fetchFn).toHaveBeenCalledTimes(1);
  expect(fetchFn.mock.calls[0][0]).toBe("http://api.internal:8080/actuator/health");
  expect(fetchFn.mock.calls[0][1]).toMatchObject({ cache: "no-store" });
});

test("a backend that does not answer, or answers with an error, is no failure", async () => {
  const unreachable = vi.fn(async () => {
    throw new TypeError("fetch failed");
  });
  const asleep = vi.fn(async () => new Response("", { status: 503 }));

  await expect(wakeBackend(unreachable, "http://localhost:8080")).resolves.toBeUndefined();
  await expect(wakeBackend(asleep, "http://localhost:8080")).resolves.toBeUndefined();
});
