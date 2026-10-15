import { expect, test } from "vitest";
import { directionsUrl, displayUrl, formatDate, httpUrl, telHref } from "./format";

test("formats a date in New Zealand time", () => {
  expect(formatDate("2026-10-02T01:30:00Z")).toBe("2 Oct 2026");
});

test("uses the New Zealand day, not the UTC day", () => {
  // 12:30 UTC is 01:30 on the next day in New Zealand (UTC+13 in October).
  expect(formatDate("2026-10-01T12:30:00Z")).toBe("2 Oct 2026");
});

test("uses the New Zealand day in winter too", () => {
  // UTC+12 in July: 11:59 UTC is still the same day, 12:00 UTC is the next.
  expect(formatDate("2026-07-01T11:59:00Z")).toBe("1 Jul 2026");
  expect(formatDate("2026-07-01T12:00:00Z")).toBe("2 Jul 2026");
});

test("shows a URL without its protocol or trailing slash", () => {
  expect(displayUrl("https://lakesidekitchen.example")).toBe("lakesidekitchen.example");
  expect(displayUrl("https://lakesidekitchen.example/")).toBe("lakesidekitchen.example");
  expect(displayUrl("http://a.example/menu")).toBe("a.example/menu");
});

test("accepts only http and https URLs as links", () => {
  expect(httpUrl("https://lakesidekitchen.example")).toBe("https://lakesidekitchen.example");
  expect(httpUrl("http://a.example/menu")).toBe("http://a.example/menu");
  expect(httpUrl("javascript:alert(1)")).toBeNull();
  expect(httpUrl("lakesidekitchen.example")).toBeNull();
  expect(httpUrl("")).toBeNull();
});

test("builds a tel link without the spaces", () => {
  expect(telHref("03 000 0000")).toBe("tel:030000000");
  expect(telHref("+64 3 000 0000")).toBe("tel:+6430000000");
  expect(telHref("+64 (3) 000-0000")).toBe("tel:+64(3)000-0000");
});

test("does not build a tel link from something that is not a number", () => {
  expect(telHref("call us")).toBeNull();
  expect(telHref("")).toBeNull();
  expect(telHref("12")).toBeNull();
});

test("builds a Google Maps directions link to the place", () => {
  expect(directionsUrl({ latitude: -45.0322, longitude: 168.661 })).toBe(
    "https://www.google.com/maps/dir/?api=1&destination=-45.0322,168.661",
  );
});
