import type { MarkersResponse } from "@queenstown/shared";
import { beforeEach, expect, test, vi } from "vitest";
import { apiGet } from "./client";
import { getMarkers } from "./map";

vi.mock("./client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./client")>()),
  apiGet: vi.fn(),
}));

const apiGetMock = vi.mocked(apiGet);

const box = { west: 168.65, south: -45.04, east: 168.67, north: -45.02 };

const answer: MarkersResponse = {
  markers: [
    {
      kind: "place",
      slug: "lakeside-kitchen",
      latitude: -45.0322,
      longitude: 168.661,
      name: "Lakeside Kitchen",
      category: "food",
      subtype: null,
    },
  ],
  truncated: false,
};

beforeEach(() => {
  apiGetMock.mockReset();
  apiGetMock.mockResolvedValue(answer);
});

test("asks for the box", async () => {
  await expect(getMarkers(box, [])).resolves.toEqual(answer);

  expect(apiGetMock.mock.calls[0][0]).toBe("/map/markers?west=168.65&south=-45.04&east=168.67&north=-45.02");
});

test("adds the filter when one is chosen", async () => {
  await getMarkers(box, ["food", "cafe"]);

  expect(apiGetMock.mock.calls[0][0]).toBe(
    "/map/markers?west=168.65&south=-45.04&east=168.67&north=-45.02&filter=food%2Ccafe",
  );
});

test("passes the signal on", async () => {
  const { signal } = new AbortController();

  await getMarkers(box, [], { signal });

  expect(apiGetMock.mock.calls[0][1]?.signal).toBe(signal);
});
