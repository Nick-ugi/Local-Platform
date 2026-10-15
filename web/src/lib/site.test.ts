import { afterEach, expect, test, vi } from "vitest";
import { siteUrl } from "./site";

afterEach(() => {
  vi.unstubAllEnvs();
});

test("reads SITE_URL", () => {
  vi.stubEnv("SITE_URL", "https://queenstownlocal.example");

  expect(siteUrl().toString()).toBe("https://queenstownlocal.example/");
});

test("falls back to the local web app", () => {
  vi.stubEnv("SITE_URL", undefined);
  expect(siteUrl().toString()).toBe("http://localhost:3001/");

  vi.stubEnv("SITE_URL", "not a url");
  expect(siteUrl().toString()).toBe("http://localhost:3001/");
});
