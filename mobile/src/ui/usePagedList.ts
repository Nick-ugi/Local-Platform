import type { Page } from "@queenstown/shared";
import { useCallback, useEffect, useRef, useState } from "react";

export interface PagedListState<T> {
  /** Of the first page: "loading" until it comes, "error" when it failed. */
  status: "loading" | "ready" | "error";
  items: T[];
  /** How many the whole list has. */
  total: number;
  /** Of the next page. */
  more: "idle" | "loading" | "error";
  /** Asks for the next page, when there is one and none is on its way. */
  loadMore: () => void;
  /** Asks again for what failed: the first page, or the next one. */
  retry: () => void;
}

type Loaded<T> = {
  key: string;
  status: "ready" | "error";
  items: T[];
  total: number;
  /** The last page that came. */
  page: number;
  more: "idle" | "loading" | "error";
};

/**
 * A list that comes a page at a time, such as Local's events and notices (APP-01). `key` names the
 * list; `load` fetches one of its pages and changes only with the key (callers memoise it). A new
 * list starts again from the first page, and the requests for the old one are cancelled so their
 * answers cannot land in the new list. One next page is asked for at a time.
 */
export function usePagedList<T>(
  key: string,
  load: (page: number, signal: AbortSignal) => Promise<Page<T>>,
): PagedListState<T> {
  const [loaded, setLoaded] = useState<Loaded<T> | null>(null);
  const [attempt, setAttempt] = useState(0);
  // The key of the list on screen, for answers to check against when they arrive.
  const current = useRef(key);
  const moreRequest = useRef<AbortController | null>(null);

  useEffect(() => {
    current.current = key;
    const controller = new AbortController();
    load(1, controller.signal).then(
      (page) => {
        if (!controller.signal.aborted) {
          setLoaded({ key, status: "ready", items: page.items, total: page.total, page: 1, more: "idle" });
        }
      },
      () => {
        if (!controller.signal.aborted) {
          setLoaded({ key, status: "error", items: [], total: 0, page: 0, more: "idle" });
        }
      },
    );
    return () => {
      controller.abort();
      moreRequest.current?.abort();
      moreRequest.current = null;
    };
  }, [key, load, attempt]);

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
    setLoaded({ ...loaded, more: "loading" });
    load(next, controller.signal).then(
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
  }, [loaded, key, load]);

  const retry = useCallback(() => {
    if (loaded !== null && loaded.key === key && loaded.status === "ready") {
      loadMore();
    } else {
      setAttempt((count) => count + 1);
    }
  }, [loaded, key, loadMore]);

  if (loaded === null || loaded.key !== key) {
    return { status: "loading", items: [], total: 0, more: "idle", loadMore, retry };
  }
  return { status: loaded.status, items: loaded.items, total: loaded.total, more: loaded.more, loadMore, retry };
}
