import { type PlaceMarker, placeMarkerOf } from "@queenstown/shared";
import { useCallback, useEffect, useState } from "react";
import { getPlaces } from "@/lib/api/places";

/** How many search results the map shows: the most one page of the list API holds. */
export const SEARCH_MARKERS = 50;

export interface SearchMarkersState {
  /** "idle" without search words. */
  status: "idle" | "loading" | "ready" | "error";
  /** The places that match, as markers, at most fifty. */
  markers: PlaceMarker[];
  /** How many places match in all. */
  total: number;
  retry: () => void;
}

type Answer = { request: string; ok: boolean; markers: PlaceMarker[]; total: number };

/**
 * The places that match search words, for the map (SEARCH-03). A request for words no longer
 * wanted is cancelled, so its answer cannot land on newer ones.
 */
export function useSearchMarkers(q: string | null): SearchMarkersState {
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [attempt, setAttempt] = useState(0);
  const request = q === null ? null : `${q}|${attempt}`;

  useEffect(() => {
    if (q === null) {
      return;
    }
    const thisRequest = `${q}|${attempt}`;
    const controller = new AbortController();
    getPlaces({ q, size: SEARCH_MARKERS }, { signal: controller.signal }).then(
      (page) => {
        if (!controller.signal.aborted) {
          setAnswer({ request: thisRequest, ok: true, markers: page.items.map(placeMarkerOf), total: page.total });
        }
      },
      () => {
        if (!controller.signal.aborted) {
          setAnswer({ request: thisRequest, ok: false, markers: [], total: 0 });
        }
      },
    );
    return () => controller.abort();
  }, [q, attempt]);

  const retry = useCallback(() => setAttempt((count) => count + 1), []);

  if (request === null) {
    return { status: "idle", markers: [], total: 0, retry };
  }
  if (answer?.request !== request) {
    return { status: "loading", markers: [], total: 0, retry };
  }
  return { status: answer.ok ? "ready" : "error", markers: answer.markers, total: answer.total, retry };
}
