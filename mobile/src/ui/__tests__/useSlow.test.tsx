import { act, renderHook } from "@testing-library/react-native";
import { useSlow } from "../useSlow";

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

test("turns true when something has been loading for five seconds", () => {
  const { result } = renderHook(() => useSlow(true));
  expect(result.current).toBe(false);

  act(() => jest.advanceTimersByTime(4999));
  expect(result.current).toBe(false);

  act(() => jest.advanceTimersByTime(1));
  expect(result.current).toBe(true);
});

test("goes back to false when the loading ends, and counts again from the next one", () => {
  const { result, rerender } = renderHook(({ active }: { active: boolean }) => useSlow(active), {
    initialProps: { active: true },
  });
  act(() => jest.advanceTimersByTime(5000));
  expect(result.current).toBe(true);

  rerender({ active: false });
  expect(result.current).toBe(false);

  rerender({ active: true });
  act(() => jest.advanceTimersByTime(3000));
  expect(result.current).toBe(false);
});

test("never turns true while nothing is loading", () => {
  const { result } = renderHook(() => useSlow(false, 1000));

  act(() => jest.advanceTimersByTime(10_000));

  expect(result.current).toBe(false);
});
