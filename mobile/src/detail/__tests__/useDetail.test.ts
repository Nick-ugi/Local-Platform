import { act, renderHook } from "@testing-library/react-native";
import { useDetail } from "../useDetail";

test("loads, then is ready", async () => {
  const load = jest.fn(async (slug: string) => ({ slug }));

  const { result } = renderHook(() => useDetail(load, "a"));
  expect(result.current.status).toBe("loading");
  await act(async () => {});

  expect(result.current).toMatchObject({ status: "ready", data: { slug: "a" } });
});

test("nothing for the slug is not found", async () => {
  const load = jest.fn(async () => null);
  const { result } = renderHook(() => useDetail(load, "gone"));
  await act(async () => {});

  expect(result.current.status).toBe("notFound");
});

test("a failure can be tried again", async () => {
  const load = jest.fn().mockRejectedValueOnce(new Error("offline")).mockResolvedValueOnce({ slug: "a" });
  const { result } = renderHook(() => useDetail(load, "a"));
  await act(async () => {});
  expect(result.current.status).toBe("error");

  await act(async () => result.current.retry());

  expect(result.current.status).toBe("ready");
  expect(load).toHaveBeenCalledTimes(2);
});

test("the answer for a slug no longer shown is dropped", async () => {
  let finishOld: (value: { slug: string }) => void = () => {};
  const load = jest.fn((slug: string) =>
    slug === "old" ? new Promise<{ slug: string }>((resolve) => (finishOld = resolve)) : Promise.resolve({ slug }),
  );
  const { result, rerender } = renderHook(({ slug }: { slug: string }) => useDetail(load, slug), {
    initialProps: { slug: "old" },
  });

  rerender({ slug: "new" });
  await act(async () => {});
  await act(async () => finishOld({ slug: "old" }));

  expect(result.current).toMatchObject({ status: "ready", data: { slug: "new" } });
});
