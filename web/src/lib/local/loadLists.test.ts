import { beforeEach, expect, test, vi } from "vitest";
import { getEvents } from "@/lib/api/events";
import { getNotices } from "@/lib/api/notices";
import { loadEvents, loadNotices } from "./loadLists";

vi.mock("@/lib/api/events", () => ({ getEvents: vi.fn() }));
vi.mock("@/lib/api/notices", () => ({ getNotices: vi.fn() }));

const empty = { items: [], page: 1, size: 20, total: 0 };

beforeEach(() => {
  vi.mocked(getNotices).mockReset().mockResolvedValue(empty);
  vi.mocked(getEvents).mockReset().mockResolvedValue(empty);
});

test("reads the type and the page", async () => {
  await expect(loadNotices("road-work", undefined)).resolves.toEqual({ type: "road-work", result: empty });
  expect(getNotices).toHaveBeenCalledWith({ type: "road-work", page: 1 });
});

test("an empty first page is a list without notices", async () => {
  await expect(loadNotices(undefined, undefined)).resolves.toEqual({ type: null, result: empty });
});

test.each([
  ["fire", undefined],
  [undefined, "0"],
  [undefined, "abc"],
])("type %s and page %s name no list", async (type, page) => {
  await expect(loadNotices(type, page)).resolves.toBeNull();
  expect(getNotices).not.toHaveBeenCalled();
});

test("a page past the end names no list", async () => {
  await expect(loadNotices(undefined, "9")).resolves.toBeNull();
  await expect(loadEvents(undefined, "9")).resolves.toBeNull();
});

test("reads the period and refuses one it does not know", async () => {
  await expect(loadEvents("week", "1")).resolves.toEqual({ when: "week", result: empty });
  expect(getEvents).toHaveBeenCalledWith({ when: "week", page: 1 });
  await expect(loadEvents("year", undefined)).resolves.toBeNull();
});
