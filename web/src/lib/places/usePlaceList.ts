import type { LatLng, Page, PlaceSummary } from "@queenstown/shared";
import { useCallback, useEffect, useState } from "react";
import { getPlaces } from "@/lib/api/places";
import type { ListQuery } from "./listUrl";

export interface PlaceListState {
  /** The page to show: the server's until the list has been ordered from the visitor's position. */
  result: Page<PlaceSummary>;
  /** Of the request that orders the list from the position. "ready" when there is none to make. */
  status: "ready" | "loading" | "error";
  /** Asks again for the same list from the same position. */
  retry: () => void;
}

/**
 * A page of places that the server drew from the centre of Queenstown, ordered again from the
 * visitor's position once that is known. Without a position nothing is requested.
 *
 * An answer belongs to one list and one position. When either changes, the server's page shows
 * until the new answer arrives, and the request that is no longer wanted is cancelled so its
 * answer cannot replace a newer one. When a request fails the list on screen stays.
 */
export function usePlaceList(query: ListQuery, initial: Page<PlaceSummary>, position: LatLng | null): PlaceListState {
  const [settled, setSettled] = useState<{ request: string; result: Page<PlaceSummary> | null } | null>(null);
  const [attempt, setAttempt] = useState(0);

  // Callers pass new objects on every render; the key changes only when the values do.
  const { category, q, page } = query;
  const latitude = position?.latitude ?? null;
  const longitude = position?.longitude ?? null;
  const request =
    latitude === null || longitude === null
      ? null
      : JSON.stringify([category, q, page, latitude, longitude, attempt]);

  useEffect(() => {
    if (request === null || latitude === null || longitude === null) {
      return;
    }
    const controller = new AbortController();
    getPlaces({ category, q, page, position: { latitude, longitude } }, { signal: controller.signal }).then(
      (result) => {
        if (!controller.signal.aborted) {
          setSettled({ request, result });
        }
      },
      () => {
        if (!controller.signal.aborted) {
          setSettled({ request, result: null });
        }
      },
    );
    return () => controller.abort();
  }, [request, category, q, page, latitude, longitude]);

  const retry = useCallback(() => setAttempt((count) => count + 1), []);

  if (request === null) {
    return { result: initial, status: "ready", retry };
  }
  if (settled?.request !== request) {
    return { result: initial, status: "loading", retry };
  }
  return settled.result === null
    ? { result: initial, status: "error", retry }
    : { result: settled.result, status: "ready", retry };
}
