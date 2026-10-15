import { beforeEach, expect, test, vi } from "vitest";
import { ApiError, apiGet } from "./client";
import { withQuery } from "./detail";
import { getEvent, getEvents } from "./events";
import { getNotice, getNotices } from "./notices";

vi.mock("./client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./client")>()),
  apiGet: vi.fn(),
}));

const apiGetMock = vi.mocked(apiGet);

beforeEach(() => {
  apiGetMock.mockReset();
  apiGetMock.mockResolvedValue({ items: [], page: 1, size: 20, total: 0 });
});

test("asks for the events of a period and a page", async () => {
  await getEvents({});
  await getEvents({ when: "week", page: 2 });
  await getEvents({ when: null, page: 1 });

  expect(apiGetMock.mock.calls.map((call) => call[0])).toEqual(["/events", "/events?when=week&page=2", "/events"]);
});

test("asks for the notices of a type and a page", async () => {
  await getNotices({ type: "road-work" });
  await getNotices({ page: 3 });

  expect(apiGetMock.mock.calls.map((call) => call[0])).toEqual(["/notices?type=road-work", "/notices?page=3"]);
});

test("an event or notice that is not there is null", async () => {
  apiGetMock.mockRejectedValue(new ApiError({ status: 404, code: "NOT_FOUND", detail: "x" }));

  await expect(getEvent("nope")).resolves.toBeNull();
  await expect(getNotice("nope")).resolves.toBeNull();
});

test("a detail is asked for by its encoded slug", async () => {
  apiGetMock.mockResolvedValue({});

  await getEvent("a/b");
  await getNotice("c d");

  expect(apiGetMock.mock.calls.map((call) => call[0])).toEqual(["/events/a%2Fb", "/notices/c%20d"]);
});

test("other failures are not hidden", async () => {
  apiGetMock.mockRejectedValue(new ApiError({ status: 500, code: "INTERNAL_ERROR", detail: "x" }));

  await expect(getNotice("works")).rejects.toBeInstanceOf(ApiError);
});

test("withQuery leaves out what is not set and the first page", () => {
  expect(withQuery("/events", { when: undefined, page: 1 })).toBe("/events");
  expect(withQuery("/notices", { type: "emergency", page: 2 })).toBe("/notices?type=emergency&page=2");
});
