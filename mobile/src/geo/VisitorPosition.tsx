import type { LatLng } from "@queenstown/shared";
import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { type LocationResult, locate } from "./location";

/** Why the last answer gave no position the screens can use (docs/03-user-flow.md, UF-01). */
export type LocationProblem = "outside" | "denied" | "unavailable";

export interface VisitorPosition {
  /** The last answer from the phone, or null before the first one. A new request gives a new object. */
  result: LocationResult | null;
  /** Where the visitor is, when that is known and inside the service area. Distances use it. */
  position: LatLng | null;
  /** Why there is no position, after an answer that gave none. */
  problem: LocationProblem | null;
  /** True while the phone is finding the position. */
  locating: boolean;
  /** Asks the phone again. Never rejects. */
  request: () => Promise<LocationResult>;
}

const VisitorPositionContext = createContext<VisitorPosition | null>(null);

/**
 * The visitor's position for the whole app. The app asks for it once, when it starts
 * (docs/03-user-flow.md, "Web과 App의 차이"), and the Map and Explore tabs share the answer, so
 * moving between them does not ask again. The Map's location button asks again for both.
 */
export function VisitorPositionProvider({ children }: { children: ReactNode }) {
  const [result, setResult] = useState<LocationResult | null>(null);
  // The question asked on arrival is already on its way.
  const [locating, setLocating] = useState(true);
  const gone = useRef(false);

  useEffect(() => {
    gone.current = false;
    void locate().then((answer) => {
      if (!gone.current) {
        setResult(answer);
        setLocating(false);
      }
    });
    return () => {
      gone.current = true;
    };
  }, []);

  const request = useCallback(async () => {
    setLocating(true);
    const answer = await locate();
    if (!gone.current) {
      setResult(answer);
      setLocating(false);
    }
    return answer;
  }, []);

  const value = useMemo<VisitorPosition>(
    () => ({
      result,
      position: result?.status === "inside" ? result.position : null,
      problem: result === null || result.status === "inside" ? null : result.status,
      locating,
      request,
    }),
    [result, locating, request],
  );

  return <VisitorPositionContext.Provider value={value}>{children}</VisitorPositionContext.Provider>;
}

export function useVisitorPosition(): VisitorPosition {
  const value = useContext(VisitorPositionContext);
  if (value === null) {
    throw new Error("useVisitorPosition needs a VisitorPositionProvider");
  }
  return value;
}
