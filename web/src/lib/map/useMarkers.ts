import type { Category, MapBounds, MapMarker } from "@queenstown/shared";
import { useCallback, useEffect, useState } from "react";
import { getMarkers } from "@/lib/api/map";

/** How long the map has to stay still before its markers are requested. */
const SETTLE_MS = 300;

export interface MarkersState {
  /** "idle" until there is a box to ask about. */
  status: "idle" | "loading" | "ready" | "error";
  /** The markers of the last answer. They stay while the next one loads, and when it fails. */
  markers: MapMarker[];
  truncated: boolean;
  /** Asks again for the same box and filter. */
  retry: () => void;
}

type Answer = { markers: MapMarker[]; truncated: boolean };

const NO_ANSWER: Answer = { markers: [], truncated: false };

/**
 * The markers for the visible part of the map. A new box or filter is requested once it has
 * stayed the same for 300 ms, so dragging the map does not send a request per frame, and a
 * request that is no longer wanted is cancelled so its answer cannot replace a newer one.
 */
export function useMarkers(bounds: MapBounds | null, filter: readonly Category[]): MarkersState {
  const [answer, setAnswer] = useState<Answer>(NO_ANSWER);
  // Which request the last answer or failure belongs to. While that is not the current one, it is loading.
  const [settled, setSettled] = useState<{ request: string; ok: boolean } | null>(null);
  const [attempt, setAttempt] = useState(0);

  // Callers pass a new object on every render; the keys change only when the values do.
  const boundsKey = bounds ? [bounds.west, bounds.south, bounds.east, bounds.north].join(",") : null;
  const filterKey = filter.join(",");
  const request = boundsKey === null ? null : `${boundsKey}|${filterKey}|${attempt}`;

  useEffect(() => {
    if (boundsKey === null) {
      return;
    }
    const [west, south, east, north] = boundsKey.split(",").map(Number);
    const categories = filterKey === "" ? [] : filterKey.split(",");
    const thisRequest = `${boundsKey}|${filterKey}|${attempt}`;
    const controller = new AbortController();

    const timer = setTimeout(() => {
      getMarkers({ west, south, east, north }, categories, { signal: controller.signal }).then(
        (response) => {
          if (!controller.signal.aborted) {
            setAnswer({ markers: response.markers, truncated: response.truncated });
            setSettled({ request: thisRequest, ok: true });
          }
        },
        () => {
          if (!controller.signal.aborted) {
            setSettled({ request: thisRequest, ok: false });
          }
        },
      );
    }, SETTLE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [boundsKey, filterKey, attempt]);

  const retry = useCallback(() => setAttempt((count) => count + 1), []);

  let status: MarkersState["status"] = "idle";
  if (request !== null) {
    status = settled?.request !== request ? "loading" : settled.ok ? "ready" : "error";
  }
  return { status, markers: answer.markers, truncated: answer.truncated, retry };
}
