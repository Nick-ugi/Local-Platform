import type { Page, PlaceSummary } from "@queenstown/shared";
import { act, renderHook } from "@testing-library/react-native";
import { getPlaces } from "@/api/places";
import { useSearchMarkers } from "../useSearchMarkers";

jest.mock("@/api/places", () => ({ getPlaces: jest.fn() }));

const getPlacesMock = jest.mocked(getPlaces);

function place(slug: string): PlaceSummary {
  return {
    slug,
    name: slug,
    category: "cafe",
    subtype: null,
    address: "Queenstown",
    imageUrl: null,
    latitude: -45.0335,
    longitude: 168.659,
    distanceM: null,
    openingHours: null,
  };
}

function page(total: number, ...slugs: string[]): Page<PlaceSummary> {
  return { items: slugs.map(place), page: 1, size: 50, total };
}

/** A request the test settles by hand. */
function pending() {
  let resolve!: (value: Page<PlaceSummary>) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<Page<PlaceSummary>>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

beforeEach(() => {
  getPlacesMock.mockReset();
});

test("asks for nothing without search words", () => {
  const { result } = renderHook(() => useSearchMarkers(null));

  expect(result.current.status).toBe("idle");
  expect(result.current.markers).toEqual([]);
  expect(getPlacesMock).not.toHaveBeenCalled();
});

test("asks for the first fifty places that match, and gives them as markers with the total", async () => {
  getPlacesMock.mockResolvedValue(page(60, "harbour-coffee", "bean-around"));
  const { result } = renderHook(() => useSearchMarkers("coffee"));
  expect(result.current.status).toBe("loading");

  await act(async () => {});

  expect(getPlacesMock.mock.lastCall?.[0]).toEqual({ q: "coffee", size: 50 });
  expect(result.current.status).toBe("ready");
  expect(result.current.markers.map((marker) => [marker.kind, marker.slug])).toEqual([
    ["place", "harbour-coffee"],
    ["place", "bean-around"],
  ]);
  expect(result.current.total).toBe(60);
});

test("a failed search says so and can be asked again", async () => {
  getPlacesMock.mockRejectedValueOnce(new Error("offline")).mockResolvedValue(page(1, "harbour-coffee"));
  const { result } = renderHook(() => useSearchMarkers("coffee"));
  await act(async () => {});
  expect(result.current.status).toBe("error");

  await act(async () => result.current.retry());

  expect(result.current.status).toBe("ready");
  expect(result.current.markers).toHaveLength(1);
});

test("the answer to old words does not land on new ones", async () => {
  const coffee = pending();
  getPlacesMock.mockReturnValueOnce(coffee.promise).mockResolvedValue(page(1, "fergburger"));
  const { result, rerender } = renderHook(({ q }: { q: string }) => useSearchMarkers(q), {
    initialProps: { q: "coffee" },
  });

  rerender({ q: "burger" });
  await act(async () => {});
  await act(async () => coffee.resolve(page(1, "harbour-coffee")));

  expect(result.current.markers.map((marker) => marker.slug)).toEqual(["fergburger"]);
});
