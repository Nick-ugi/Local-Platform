import type { Category, MapBounds, MarkersResponse } from "@queenstown/shared";
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { getMarkers } from "@/lib/api/map";
import { useMarkers } from "./useMarkers";

vi.mock("@/lib/api/map", () => ({ getMarkers: vi.fn() }));

const getMarkersMock = vi.mocked(getMarkers);

const queenstown: MapBounds = { west: 168.65, south: -45.04, east: 168.67, north: -45.02 };
const frankton: MapBounds = { west: 168.72, south: -45.03, east: 168.74, north: -45.01 };
const arrowtown: MapBounds = { west: 168.82, south: -44.95, east: 168.84, north: -44.93 };

function answer(...slugs: string[]): MarkersResponse {
  return {
    markers: slugs.map((slug) => ({
      kind: "place",
      slug,
      latitude: -45.0322,
      longitude: 168.661,
      name: slug,
      category: "food",
      subtype: null,
    })),
    truncated: false,
  };
}

/** A request the test settles by hand. */
function pending() {
  let resolve!: (value: MarkersResponse) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<MarkersResponse>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

type Props = { bounds: MapBounds | null; filter: Category[] };

function renderMarkers(initialProps: Props) {
  return renderHook(({ bounds, filter }: Props) => useMarkers(bounds, filter), { initialProps });
}

async function wait(ms: number) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
}

function signalOfCall(index: number): AbortSignal {
  const signal = getMarkersMock.mock.calls[index][2]?.signal;
  if (!signal) {
    throw new Error(`request ${index} was made without a signal`);
  }
  return signal;
}

beforeEach(() => {
  vi.useFakeTimers();
  getMarkersMock.mockReset();
});

afterEach(() => {
  vi.useRealTimers();
});

test("does nothing without bounds", async () => {
  const { result } = renderMarkers({ bounds: null, filter: [] });

  await wait(1000);

  expect(result.current.status).toBe("idle");
  expect(result.current.markers).toEqual([]);
  expect(getMarkersMock).not.toHaveBeenCalled();
});

test("waits 300 ms before asking", async () => {
  getMarkersMock.mockResolvedValue({ ...answer("a", "b"), truncated: true });
  const { result } = renderMarkers({ bounds: queenstown, filter: [] });

  await wait(299);
  expect(getMarkersMock).not.toHaveBeenCalled();
  expect(result.current.status).toBe("loading");

  await wait(1);
  expect(getMarkersMock).toHaveBeenCalledTimes(1);
  expect(getMarkersMock.mock.calls[0][0]).toEqual(queenstown);
  expect(getMarkersMock.mock.calls[0][1]).toEqual([]);
  expect(result.current.status).toBe("ready");
  expect(result.current.markers.map((marker) => marker.slug)).toEqual(["a", "b"]);
  expect(result.current.truncated).toBe(true);
});

test("asks once after several quick moves", async () => {
  getMarkersMock.mockResolvedValue(answer("a"));
  const { rerender } = renderMarkers({ bounds: queenstown, filter: [] });

  await wait(100);
  rerender({ bounds: frankton, filter: [] });
  await wait(100);
  rerender({ bounds: arrowtown, filter: [] });
  await wait(300);

  expect(getMarkersMock).toHaveBeenCalledTimes(1);
  expect(getMarkersMock.mock.calls[0][0]).toEqual(arrowtown);
});

test("cancels the request it no longer needs", async () => {
  getMarkersMock.mockReturnValue(pending().promise);
  const { rerender } = renderMarkers({ bounds: queenstown, filter: [] });
  await wait(300);
  expect(signalOfCall(0).aborted).toBe(false);

  rerender({ bounds: frankton, filter: [] });

  expect(signalOfCall(0).aborted).toBe(true);
});

test("a late answer does not replace a newer one", async () => {
  const first = pending();
  const second = pending();
  getMarkersMock.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
  const { result, rerender } = renderMarkers({ bounds: queenstown, filter: [] });
  await wait(300);
  rerender({ bounds: frankton, filter: [] });
  await wait(300);

  await act(async () => second.resolve(answer("new")));
  await act(async () => first.resolve(answer("old")));

  expect(result.current.status).toBe("ready");
  expect(result.current.markers.map((marker) => marker.slug)).toEqual(["new"]);
});

test("a late failure does not spoil a newer answer", async () => {
  const first = pending();
  const second = pending();
  getMarkersMock.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
  const { result, rerender } = renderMarkers({ bounds: queenstown, filter: [] });
  await wait(300);
  rerender({ bounds: frankton, filter: [] });
  await wait(300);

  await act(async () => second.resolve(answer("new")));
  await act(async () => first.reject(new Error("too late to matter")));

  expect(result.current.status).toBe("ready");
});

test("keeps the markers on screen when a request fails", async () => {
  getMarkersMock.mockResolvedValueOnce(answer("a", "b")).mockRejectedValueOnce(new Error("no network"));
  const { result, rerender } = renderMarkers({ bounds: queenstown, filter: [] });
  await wait(300);

  rerender({ bounds: frankton, filter: [] });
  await wait(300);

  expect(result.current.status).toBe("error");
  expect(result.current.markers.map((marker) => marker.slug)).toEqual(["a", "b"]);
});

test("retry asks again for the same box", async () => {
  getMarkersMock.mockRejectedValueOnce(new Error("no network")).mockResolvedValueOnce(answer("a"));
  const { result } = renderMarkers({ bounds: queenstown, filter: ["cafe"] });
  await wait(300);
  expect(result.current.status).toBe("error");

  act(() => result.current.retry());
  expect(result.current.status).toBe("loading");
  await wait(300);

  expect(getMarkersMock).toHaveBeenCalledTimes(2);
  expect(getMarkersMock.mock.calls[1][0]).toEqual(queenstown);
  expect(getMarkersMock.mock.calls[1][1]).toEqual(["cafe"]);
  expect(result.current.status).toBe("ready");
  expect(result.current.markers.map((marker) => marker.slug)).toEqual(["a"]);
});

test("asks again when the filter changes", async () => {
  getMarkersMock.mockResolvedValue(answer("a"));
  const { rerender } = renderMarkers({ bounds: queenstown, filter: [] });
  await wait(300);

  rerender({ bounds: queenstown, filter: ["food", "cafe"] });
  await wait(300);

  expect(getMarkersMock).toHaveBeenCalledTimes(2);
  expect(getMarkersMock.mock.calls[1][1]).toEqual(["food", "cafe"]);
});

// The screen builds the filter from the URL on every render, so equal values arrive as new objects.
test("does not ask again for an equal box and filter", async () => {
  getMarkersMock.mockResolvedValue(answer("a"));
  const { result, rerender } = renderMarkers({ bounds: queenstown, filter: ["food"] });
  await wait(300);

  rerender({ bounds: { ...queenstown }, filter: ["food"] });
  await wait(1000);

  expect(getMarkersMock).toHaveBeenCalledTimes(1);
  expect(result.current.status).toBe("ready");
});

test("stops asking when the screen goes away", async () => {
  getMarkersMock.mockResolvedValue(answer("a"));
  const { unmount } = renderMarkers({ bounds: queenstown, filter: [] });

  unmount();
  await wait(1000);

  expect(getMarkersMock).not.toHaveBeenCalled();
});
