import { useCallback, useEffect, useState } from "react";

export type DetailState<T> =
  | { status: "loading" }
  | { status: "ready"; data: T }
  | { status: "notFound" }
  | { status: "error" };

type Load<T> = (slug: string, options: { signal: AbortSignal }) => Promise<T | null>;

/**
 * The place, event or notice a detail screen is about. "notFound" when the server has none for
 * the slug, "error" when it could not be asked; retry() asks again. A request for a slug the
 * screen no longer shows is cancelled.
 */
export function useDetail<T>(load: Load<T>, slug: string): DetailState<T> & { retry: () => void } {
  const [settled, setSettled] = useState<{ request: string; state: DetailState<T> } | null>(null);
  const [attempt, setAttempt] = useState(0);
  const request = `${slug}|${attempt}`;

  useEffect(() => {
    const controller = new AbortController();
    const thisRequest = `${slug}|${attempt}`;
    load(slug, { signal: controller.signal }).then(
      (data) => {
        if (!controller.signal.aborted) {
          setSettled({ request: thisRequest, state: data === null ? { status: "notFound" } : { status: "ready", data } });
        }
      },
      () => {
        if (!controller.signal.aborted) {
          setSettled({ request: thisRequest, state: { status: "error" } });
        }
      },
    );
    return () => controller.abort();
  }, [load, slug, attempt]);

  const retry = useCallback(() => setAttempt((count) => count + 1), []);
  const state: DetailState<T> = settled?.request === request ? settled.state : { status: "loading" };
  return { ...state, retry };
}
