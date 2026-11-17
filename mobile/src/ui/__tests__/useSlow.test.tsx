import { act, renderHook } from "@testing-library/react-native";
import { useSlow } from "../useSlow";

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

test("turns true when something has been loading for five seconds", async () => {
  const { result } = await renderHook(() => useSlow(true));
  expect(result.current).toBe(false);

  await act(() => jest.advanceTimersByTime(4999));
  expect(result.current).toBe(false);

  await act(() => jest.advanceTimersByTime(1));
  expect(result.current).toBe(true);
});

test("goes back to false when the loading ends, and counts again from the next one", async () => {
  const { result, rerender } = await renderHook(({ active }: { active: boolean }) => useSlow(active), {
    initialProps: { active: true },
  });
  await act(() => jest.advanceTimersByTime(5000));
  expect(result.current).toBe(true);

  await rerender({ active: false });
  expect(result.current).toBe(false);

  await rerender({ active: true });
  await act(() => jest.advanceTimersByTime(3000));
  expect(result.current).toBe(false);
});

test("never turns true while nothing is loading", async () => {
  const { result } = await renderHook(() => useSlow(false, 1000));

  await act(() => jest.advanceTimersByTime(10_000));

  expect(result.current).toBe(false);
});
