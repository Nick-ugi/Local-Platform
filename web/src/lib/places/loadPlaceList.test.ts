import { beforeEach, expect, test, vi } from "vitest";
import { getPlaces } from "@/lib/api/places";
import { pageOf, placeSummary } from "@/test/places";
import { loadPlaceList } from "./loadPlaceList";

vi.mock("@/lib/api/places", () => ({ getPlaces: vi.fn() }));

const getPlacesMock = vi.mocked(getPlaces);

beforeEach(() => {
  getPlacesMock.mockReset();
});

test("reads the page the URL names", async () => {
  const result = pageOf([placeSummary()], { page: 2, total: 21 });
  getPlacesMock.mockResolvedValue(result);

  const list = await loadPlaceList({ category: "food", q: null }, "2");

  expect(getPlacesMock).toHaveBeenCalledTimes(1);
  // No position: the server draws every list from the centre of Queenstown.
  expect(getPlacesMock).toHaveBeenCalledWith({ category: "food", q: null, page: 2 });
  expect(list).toEqual({ query: { category: "food", q: null, page: 2 }, result });
});

test("reads the first page when the URL names none", async () => {
  getPlacesMock.mockResolvedValue(pageOf([placeSummary()]));

  const list = await loadPlaceList({ category: null, q: "pizza" }, undefined);

  expect(getPlacesMock).toHaveBeenCalledWith({ category: null, q: "pizza", page: 1 });
  expect(list?.query.page).toBe(1);
});

test("refuses a page value that is not a page", async () => {
  await expect(loadPlaceList({ category: null, q: null }, "abc")).resolves.toBeNull();

  expect(getPlacesMock).not.toHaveBeenCalled();
});

test("refuses a page past the end", async () => {
  getPlacesMock.mockResolvedValue(pageOf([], { page: 3, total: 21 }));

  await expect(loadPlaceList({ category: null, q: null }, "3")).resolves.toBeNull();
});

test("an empty first page is still a page", async () => {
  const result = pageOf([]);
  getPlacesMock.mockResolvedValue(result);

  await expect(loadPlaceList({ category: "bar", q: null }, undefined)).resolves.toEqual({
    query: { category: "bar", q: null, page: 1 },
    result,
  });
});

test("passes a failed request on", async () => {
  const error = new Error("down");
  getPlacesMock.mockRejectedValue(error);

  await expect(loadPlaceList({ category: null, q: null }, undefined)).rejects.toBe(error);
});
