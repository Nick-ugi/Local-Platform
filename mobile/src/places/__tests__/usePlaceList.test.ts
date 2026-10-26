import type { LatLng, Page, PlaceSummary } from "@queenstown/shared";
import { act, renderHook } from "@testing-library/react-native";
import { getPlaces } from "@/api/places";
import { type ListQuery, usePlaceList } from "../usePlaceList";

jest.mock("@/api/places", () => ({ getPlaces: jest.fn() }));

const getPlacesMock = jest.mocked(getPlaces);

function place(n: number, distanceM: number | null = null): PlaceSummary {
  return {
    slug: `place-${n}`,
    name: `Place ${n}`,
    category: "cafe",
    subtype: null,
    address: `${n} Beach Street`,
    imageUrl: null,
    latitude: -45.03,
    longitude: 168.66,
    distanceM,
    openingHours: null,
  };
}

function page(numbers: number[], total: number, pageNumber = 1): Page<PlaceSummary> {
  return { items: numbers.map((n) => place(n)), page: pageNumber, size: 20, total };
}

/** A request whose answer the test gives when it wants. */
function deferred() {
  let resolve: (value: Page<PlaceSummary>) => void = () => {};
  let reject: (error: unknown) => void = () => {};
  const promise = new Promise<Page<PlaceSummary>>((ok, fail) => {
    resolve = ok;
    reject = fail;
  });
  return { promise, resolve, reject };
}

const all: ListQuery = { category: null, q: null };
const here = { latitude: -45.0312, longitude: 168.6626 };

beforeEach(() => getPlacesMock.mockReset());

test("loads the first page from the centre without a position", async () => {
  getPlacesMock.mockResolvedValue(page([1, 2], 2));

  const { result } = renderHook(() => usePlaceList(all, null));
  expect(result.current.status).toBe("loading");
  await act(async () => {});

  expect(getPlacesMock).toHaveBeenCalledWith(
    { category: null, q: null, position: null },
    { signal: expect.any(AbortSignal) },
  );
  expect(result.current.status).toBe("ready");
  expect(result.current.items.map((item) => item.slug)).toEqual(["place-1", "place-2"]);
  expect(result.current.total).toBe(2);
});

test("asks from the visitor's position when there is one", async () => {
  getPlacesMock.mockResolvedValue(page([1], 1));

  renderHook(() => usePlaceList({ category: "cafe", q: "flat white" }, here));
  await act(async () => {});

  expect(getPlacesMock.mock.calls[0][0]).toEqual({ category: "cafe", q: "flat white", position: here });
});

test("the next page is added, and asking twice asks once", async () => {
  getPlacesMock.mockResolvedValueOnce(page([1, 2], 3));
  const { result } = renderHook(() => usePlaceList(all, null));
  await act(async () => {});
  const next = deferred();
  getPlacesMock.mockReturnValueOnce(next.promise);

  act(() => result.current.loadMore());
  act(() => result.current.loadMore());
  expect(result.current.more).toBe("loading");
  expect(getPlacesMock).toHaveBeenCalledTimes(2);
  expect(getPlacesMock.mock.calls[1][0]).toEqual({ category: null, q: null, position: null, page: 2 });

  await act(async () => next.resolve(page([3], 3, 2)));

  expect(result.current.items.map((item) => item.slug)).toEqual(["place-1", "place-2", "place-3"]);
  expect(result.current.more).toBe("idle");

  // Every place is there: nothing more to ask for.
  act(() => result.current.loadMore());
  expect(getPlacesMock).toHaveBeenCalledTimes(2);
});

test("a new list starts again, and the old list's late answer is dropped", async () => {
  const old = deferred();
  getPlacesMock.mockReturnValueOnce(old.promise);
  const { result, rerender } = renderHook(({ query }: { query: ListQuery }) => usePlaceList(query, null), {
    initialProps: { query: all },
  });
  getPlacesMock.mockResolvedValueOnce(page([7], 1));

  rerender({ query: { category: "bar", q: null } });
  await act(async () => {});
  await act(async () => old.resolve(page([1, 2], 2)));

  expect(result.current.items.map((item) => item.slug)).toEqual(["place-7"]);
});

test("a new position keeps the places on screen until the new order comes", async () => {
  getPlacesMock.mockResolvedValueOnce(page([1, 2], 2));
  const { result, rerender } = renderHook(({ at }: { at: LatLng | null }) => usePlaceList(all, at), {
    initialProps: { at: null as LatLng | null },
  });
  await act(async () => {});
  const ordered = deferred();
  getPlacesMock.mockReturnValueOnce(ordered.promise);

  rerender({ at: here });
  expect(result.current.status).toBe("ready");
  expect(result.current.items.map((item) => item.slug)).toEqual(["place-1", "place-2"]);

  await act(async () =>
    ordered.resolve({ items: [place(2, 120), place(1, 480)], page: 1, size: 20, total: 2 }),
  );
  expect(result.current.items.map((item) => item.distanceM)).toEqual([120, 480]);
});

test("a new category does not show the old category's places while it loads", async () => {
  getPlacesMock.mockResolvedValueOnce(page([1], 1));
  const { result, rerender } = renderHook(({ query }: { query: ListQuery }) => usePlaceList(query, null), {
    initialProps: { query: all },
  });
  await act(async () => {});
  getPlacesMock.mockReturnValueOnce(new Promise(() => {}));

  rerender({ query: { category: "bar", q: null } });

  expect(result.current.status).toBe("loading");
  expect(result.current.items).toEqual([]);
});

test("a failed first page can be asked for again", async () => {
  getPlacesMock.mockRejectedValueOnce(new Error("offline"));
  const { result } = renderHook(() => usePlaceList(all, null));
  await act(async () => {});
  expect(result.current.status).toBe("error");

  getPlacesMock.mockResolvedValueOnce(page([1], 1));
  await act(async () => result.current.retry());

  expect(result.current.status).toBe("ready");
  expect(result.current.items).toHaveLength(1);
});

test("a failed next page keeps the list and can be asked for again", async () => {
  getPlacesMock.mockResolvedValueOnce(page([1], 2));
  const { result } = renderHook(() => usePlaceList(all, null));
  await act(async () => {});

  getPlacesMock.mockRejectedValueOnce(new Error("offline"));
  await act(async () => result.current.loadMore());
  expect(result.current.more).toBe("error");
  expect(result.current.items).toHaveLength(1);

  getPlacesMock.mockResolvedValueOnce(page([2], 2, 2));
  await act(async () => result.current.retry());
  expect(result.current.items).toHaveLength(2);
  expect(getPlacesMock.mock.calls.at(-1)?.[0]).toMatchObject({ page: 2 });
});
