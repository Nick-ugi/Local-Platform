import { isNoticeType } from "@queenstown/shared";
import { expect, test } from "vitest";
import { withPage } from "@/lib/places/listUrl";
import { eventsPath, noticesPath, readFilter } from "./listUrl";

test("reads a filter that is absent, known or unknown", () => {
  expect(readFilter(undefined, isNoticeType)).toBeNull();
  expect(readFilter("road-work", isNoticeType)).toBe("road-work");
  expect(readFilter("fire", isNoticeType)).toBeUndefined();
  expect(readFilter("", isNoticeType)).toBeUndefined();
  expect(readFilter(["road-work", "emergency"], isNoticeType)).toBeUndefined();
});

test("builds the address of a list and its pages", () => {
  expect(noticesPath(null)).toBe("/notices");
  expect(noticesPath("road-closure")).toBe("/notices?type=road-closure");
  expect(eventsPath("week")).toBe("/events?when=week");
  expect(withPage(eventsPath("week"), 2)).toBe("/events?when=week&page=2");
  expect(withPage(eventsPath(null), 2)).toBe("/events?page=2");
});
