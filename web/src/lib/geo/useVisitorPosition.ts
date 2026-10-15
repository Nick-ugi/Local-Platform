import type { LatLng } from "@queenstown/shared";
import { useCallback, useEffect, useRef, useState } from "react";
import { type LocationResult, locate, wasLocationGranted } from "./location";

/** Why a request for the visitor's position gave none the screen can use. */
export type LocationProblem = "outside" | "denied" | "unavailable";

export interface VisitorPosition {
  /** Where the visitor is, when that is known and inside the service area. */
  position: LatLng | null;
  /** What went wrong the last time the visitor asked. Looking on arrival never sets it. */
  problem: LocationProblem | null;
  /** True while a request the visitor made is waiting for the browser. */
  locating: boolean;
  /** Asks the browser, which may ask the visitor for permission. Never rejects. */
  request: () => Promise<LocationResult>;
  dismissProblem: () => void;
}

/**
 * The visitor's position for a screen that shows distances (docs/03-user-flow.md, UF-01).
 *
 * The browser is asked only when the visitor does something that calls request(). A visitor who
 * allowed it on an earlier visit is located on arrival without being asked; if that gives no
 * usable position the screen simply has none and says nothing about it.
 */
export function useVisitorPosition(): VisitorPosition {
  const [position, setPosition] = useState<LatLng | null>(null);
  const [problem, setProblem] = useState<LocationProblem | null>(null);
  const [locating, setLocating] = useState(false);
  const gone = useRef(false);

  useEffect(() => {
    gone.current = false;
    void wasLocationGranted().then(async (granted) => {
      if (!granted) {
        return;
      }
      const result = await locate();
      if (!gone.current && result.status === "inside") {
        setPosition(result.position);
      }
    });
    return () => {
      gone.current = true;
    };
  }, []);

  const request = useCallback(async () => {
    setLocating(true);
    const result = await locate();
    if (gone.current) {
      return result;
    }
    setLocating(false);
    if (result.status === "inside") {
      setPosition(result.position);
      setProblem(null);
    } else {
      // Distances from an earlier position would mislead.
      setPosition(null);
      setProblem(result.status);
    }
    return result;
  }, []);

  const dismissProblem = useCallback(() => setProblem(null), []);

  return { position, problem, locating, request, dismissProblem };
}
