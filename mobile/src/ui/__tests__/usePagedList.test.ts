import type { Page } from "@queenstown/shared";
import { act, renderHook } from "@testing-library/react-native";
import { usePagedList } from "../usePagedList";

function page(items: string[], pageNumber: number, total: number): Page<string> {
  return { items, page: pageNumber, size: 2, total };
}

/** A request the test settles by hand. */
function pending() {
  let resolve!: (value: Page<string>) => void;
  const promise = new Promise<Page<string>>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

test("loads the first page, then the next one when asked, and no further than the end", async () => {
  const load = jest.fn(async (pageNumber: number) =>
    pageNumber === 1 ? page(["a", "b"], 1, 3) : page(["c"], 2, 3),
  );
  const { result } = renderHook(() => usePagedList("events", load));
  expect(result.current.status).toBe("loading");

  await act(async () => {});
  expect(result.current).toMatchObject({ status: "ready", items: ["a", "b"], total: 3, more: "idle" });

  await act(async () => result.current.loadMore());
  expect(result.current.items).toEqual(["a", "b", "c"]);

  await act(async () => result.current.loadMore());
  expect(load).toHaveBeenCalledTimes(2);
});

test("a new list cancels the old one, whose late answer does not land in it", async () => {
  const week = pending();
  const loads = {
    week: jest.fn((_page: number, _signal: AbortSignal) => week.promise),
    month: jest.fn(async () => page(["m"], 1, 1)),
  };
  const { result, rerender } = renderHook(({ key }: { key: "week" | "month" }) => usePagedList(key, loads[key]), {
    initialProps: { key: "week" as "week" | "month" },
  });
  const weekSignal = loads.week.mock.calls[0][1];

  rerender({ key: "month" });
  await act(async () => {});
  await act(async () => week.resolve(page(["w"], 1, 1)));

  expect(weekSignal.aborted).toBe(true);
  expect(result.current.items).toEqual(["m"]);
});

test("a failed first page says so and is asked again on retry", async () => {
  const load = jest.fn().mockRejectedValueOnce(new Error("offline")).mockResolvedValue(page(["a"], 1, 1));
  const { result } = renderHook(() => usePagedList("notices", load));
  await act(async () => {});
  expect(result.current.status).toBe("error");

  await act(async () => result.current.retry());

  expect(result.current).toMatchObject({ status: "ready", items: ["a"] });
});

test("a failed next page keeps the list and is asked again on retry", async () => {
  const load = jest
    .fn()
    .mockResolvedValueOnce(page(["a", "b"], 1, 3))
    .mockRejectedValueOnce(new Error("offline"))
    .mockResolvedValue(page(["c"], 2, 3));
  const { result } = renderHook(() => usePagedList("events", load));
  await act(async () => {});

  await act(async () => result.current.loadMore());
  expect(result.current).toMatchObject({ status: "ready", items: ["a", "b"], more: "error" });

  await act(async () => result.current.retry());
  expect(result.current.items).toEqual(["a", "b", "c"]);
});
