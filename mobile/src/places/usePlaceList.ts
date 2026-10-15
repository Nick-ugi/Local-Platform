import type { Category, LatLng, PlaceSummary } from "@queenstown/shared";
import { useCallback, useEffect, useRef, useState } from "react";
import { getPlaces } from "@/api/places";

/** Which places a list shows. */
export interface ListQuery {
  category: Category | null;
  /** Search words, or null for a list that does not search. */
  q: string | null;
}

export interface PlaceListState {
  /** Of the first page: "loading" until it comes, "error" when it failed. */
  status: "loading" | "ready" | "error";
  /** The places so far, nearest first. While a new list loads, the old one stays if only the position changed. */
  items: PlaceSummary[];
  /** How many places the whole list has. */
  total: number;
  /** Of the next page. */
  more: "idle" | "loading" | "error";
  /** Asks for the next page, when there is one and none is on its way. */
  loadMore: () => void;
  /** Asks again for what failed: the first page, or the next one. */
  retry: () => void;
}

type Loaded = {
  /** The list and the position the pages belong to. */
  key: string;
  /** The list alone, to tell a new position for the same list from a new list. */
  queryKey: string;
  status: "ready" | "error";
  items: PlaceSummary[];
  total: number;
  /** The last page that came. */
  page: number;
  more: "idle" | "loading" | "error";
};

/**
 * A list of places, nearest first, a page of 20 at a time (PLACE-01 ~ PLACE-03, SEARCH-02). With a
 * position the list runs from it and has distances; without one it runs from the centre of
 * Queenstown.
 *
 * A new list or a new position starts again from the first page, and the requests for the old one
 * are cancelled so their answers cannot land in the new list. When only the position changed, the
 * places on screen stay until the new order arrives. One next page is asked for at a time.
 */
export function usePlaceList(query: ListQuery, position: LatLng | null): PlaceListState {
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [attempt, setAttempt] = useState(0);

  // Callers pass new objects on every render; the keys change only when the values do.
  const { category, q } = query;
  const latitude = position?.latitude ?? null;
  const longitude = position?.longitude ?? null;
  const queryKey = JSON.stringify([category, q]);
  const key = JSON.stringify([category, q, latitude, longitude]);

  // The key of the list now on screen, for answers to check against when they arrive.
  const current = useRef(key);
  const moreRequest = useRef<AbortController | null>(null);

  useEffect(() => {
    current.current = key;
    const controller = new AbortController();
    const at = latitude === null || longitude === null ? null : { latitude, longitude };
    getPlaces({ category, q, position: at }, { signal: controller.signal }).then(
      (page) => {
        if (!controller.signal.aborted) {
          setLoaded({ key, queryKey, status: "ready", items: page.items, total: page.total, page: 1, more: "idle" });
        }
      },
      () => {
        if (!controller.signal.aborted) {
          setLoaded({ key, queryKey, status: "error", items: [], total: 0, page: 0, more: "idle" });
        }
      },
    );
    return () => {
      controller.abort();
      moreRequest.current?.abort();
      moreRequest.current = null;
    };
  }, [key, queryKey, category, q, latitude, longitude, attempt]);

  const loadMore = useCallback(() => {
    if (
      loaded === null ||
      loaded.key !== key ||
      loaded.status !== "ready" ||
      loaded.more === "loading" ||
      loaded.items.length >= loaded.total
    ) {
      return;
    }
    const controller = new AbortController();
    moreRequest.current = controller;
    const next = loaded.page + 1;
    const at = latitude === null || longitude === null ? null : { latitude, longitude };
    setLoaded({ ...loaded, more: "loading" });
    getPlaces({ category, q, position: at, page: next }, { signal: controller.signal }).then(
      (page) => {
        if (!controller.signal.aborted && current.current === key) {
          setLoaded((list) =>
            list === null || list.key !== key
              ? list
              : { ...list, items: [...list.items, ...page.items], total: page.total, page: next, more: "idle" },
          );
        }
      },
      () => {
        if (!controller.signal.aborted && current.current === key) {
          setLoaded((list) => (list === null || list.key !== key ? list : { ...list, more: "error" }));
        }
      },
    );
  }, [loaded, key, category, q, latitude, longitude]);

  const retry = useCallback(() => {
    if (loaded !== null && loaded.key === key && loaded.status === "ready") {
      loadMore();
    } else {
      setAttempt((count) => count + 1);
    }
  }, [loaded, key, loadMore]);

  if (loaded === null || loaded.key !== key) {
    // A new position for the same list keeps the places on screen while the new order loads.
    const kept = loaded !== null && loaded.queryKey === queryKey && loaded.status === "ready" ? loaded : null;
    return {
      status: kept ? "ready" : "loading",
      items: kept?.items ?? [],
      total: kept?.total ?? 0,
      more: "idle",
      loadMore,
      retry,
    };
  }
  return { status: loaded.status, items: loaded.items, total: loaded.total, more: loaded.more, loadMore, retry };
}
