import type { LatLng, Page, PlaceSummary } from "@queenstown/shared";
import { act, renderHook } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";
import { getPlaces } from "@/lib/api/places";
import { pageOf, placeSummary } from "@/test/places";
import type { ListQuery } from "./listUrl";
import { usePlaceList } from "./usePlaceList";

vi.mock("@/lib/api/places", () => ({ getPlaces: vi.fn() }));

const getPlacesMock = vi.mocked(getPlaces);

const lakefront: LatLng = { latitude: -45.0331, longitude: 168.6597 };
const frankton: LatLng = { latitude: -45.0195, longitude: 168.732 };

const firstPage: ListQuery = { category: "food", q: null, page: 1 };
const secondPage: ListQuery = { category: "food", q: null, page: 2 };

function page(...slugs: string[]): Page<PlaceSummary> {
  return pageOf(slugs.map((slug) => placeSummary({ slug, name: slug })));
}

const fromServer = page("server-a", "server-b");

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

type Props = { query: ListQuery; initial: Page<PlaceSummary>; position: LatLng | null };

function renderList(initialProps: Props) {
  return renderHook(({ query, initial, position }: Props) => usePlaceList(query, initial, position), {
    initialProps,
  });
}

async function settle(run: () => void) {
  await act(async () => {
    run();
    await Promise.resolve();
  });
}

function signalOfCall(index: number): AbortSignal {
  const signal = getPlacesMock.mock.calls[index][1]?.signal;
  if (!signal) {
    throw new Error(`request ${index} was made without a signal`);
  }
  return signal;
}

beforeEach(() => {
  getPlacesMock.mockReset();
});

test("shows the server's page without a position", () => {
  const { result } = renderList({ query: firstPage, initial: fromServer, position: null });

  expect(result.current.result).toBe(fromServer);
  expect(result.current.status).toBe("ready");
  expect(getPlacesMock).not.toHaveBeenCalled();
});

test("asks again from the position", async () => {
  const request = pending();
  getPlacesMock.mockReturnValue(request.promise);
  const nearest = page("near-a", "near-b");

  const { result } = renderList({ query: firstPage, initial: fromServer, position: lakefront });

  expect(getPlacesMock).toHaveBeenCalledTimes(1);
  expect(getPlacesMock.mock.calls[0][0]).toEqual({ ...firstPage, position: lakefront });
  // Until the answer comes the server's list stays on screen.
  expect(result.current.status).toBe("loading");
  expect(result.current.result).toBe(fromServer);

  await settle(() => request.resolve(nearest));

  expect(result.current.status).toBe("ready");
  expect(result.current.result).toBe(nearest);
});

test("an older answer cannot replace a newer one", async () => {
  const first = pending();
  const second = pending();
  getPlacesMock.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
  const fromFrankton = page("frankton-a");

  const { result, rerender } = renderList({ query: firstPage, initial: fromServer, position: lakefront });
  rerender({ query: firstPage, initial: fromServer, position: frankton });

  expect(signalOfCall(0).aborted).toBe(true);
  expect(getPlacesMock.mock.calls[1][0]).toEqual({ ...firstPage, position: frankton });

  await settle(() => second.resolve(fromFrankton));
  await settle(() => first.resolve(page("lakefront-a")));

  expect(result.current.result).toBe(fromFrankton);
  expect(result.current.status).toBe("ready");
});

test("a new page from the server replaces an older answer", async () => {
  const first = pending();
  const second = pending();
  getPlacesMock.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
  const nextFromServer = page("server-c");
  const nextNearest = page("near-c");

  const { result, rerender } = renderList({ query: firstPage, initial: fromServer, position: lakefront });
  await settle(() => first.resolve(page("near-a")));

  rerender({ query: secondPage, initial: nextFromServer, position: lakefront });

  // The answer on screen belonged to page 1; page 2 starts from what the server sent for it.
  expect(result.current.result).toBe(nextFromServer);
  expect(result.current.status).toBe("loading");
  expect(getPlacesMock.mock.calls[1][0]).toEqual({ ...secondPage, position: lakefront });

  await settle(() => second.resolve(nextNearest));

  expect(result.current.result).toBe(nextNearest);
});

test("a failure keeps the list", async () => {
  const request = pending();
  getPlacesMock.mockReturnValue(request.promise);

  const { result } = renderList({ query: firstPage, initial: fromServer, position: lakefront });
  await settle(() => request.reject(new Error("down")));

  expect(result.current.status).toBe("error");
  expect(result.current.result).toBe(fromServer);
});

test("retry asks again", async () => {
  const nearest = page("near-a");
  getPlacesMock.mockRejectedValueOnce(new Error("down")).mockResolvedValueOnce(nearest);

  const { result } = renderList({ query: firstPage, initial: fromServer, position: lakefront });
  await settle(() => {});
  expect(result.current.status).toBe("error");

  await settle(() => result.current.retry());

  expect(getPlacesMock).toHaveBeenCalledTimes(2);
  expect(getPlacesMock.mock.calls[1][0]).toEqual({ ...firstPage, position: lakefront });
  expect(result.current.status).toBe("ready");
  expect(result.current.result).toBe(nearest);
});

test("losing the position brings the server's page back", async () => {
  getPlacesMock.mockResolvedValue(page("near-a"));

  const { result, rerender } = renderList({ query: firstPage, initial: fromServer, position: lakefront });
  await settle(() => {});

  rerender({ query: firstPage, initial: fromServer, position: null });

  // Its distances were measured from a position the screen no longer has.
  expect(result.current.result).toBe(fromServer);
  expect(result.current.status).toBe("ready");
});

test("the same position in a new object does not ask again", async () => {
  getPlacesMock.mockResolvedValue(page("near-a"));

  const { rerender } = renderList({ query: firstPage, initial: fromServer, position: lakefront });
  await settle(() => {});
  rerender({ query: { ...firstPage }, initial: fromServer, position: { ...lakefront } });
  await settle(() => {});

  expect(getPlacesMock).toHaveBeenCalledTimes(1);
});

test("a request still running when the screen goes is cancelled", () => {
  getPlacesMock.mockReturnValue(pending().promise);

  const { unmount } = renderList({ query: firstPage, initial: fromServer, position: lakefront });
  unmount();

  expect(signalOfCall(0).aborted).toBe(true);
});
