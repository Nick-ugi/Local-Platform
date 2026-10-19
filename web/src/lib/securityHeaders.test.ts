import { expect, test } from "vitest";
import { securityHeaders } from "./securityHeaders";

test("sends the four headers every page gets", () => {
  expect(Object.fromEntries(securityHeaders.map(({ key, value }) => [key, value]))).toEqual({
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "X-Frame-Options": "DENY",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=(self)",
  });
});

test("names each header once", () => {
  const names = securityHeaders.map(({ key }) => key.toLowerCase());

  expect(new Set(names).size).toBe(names.length);
});
