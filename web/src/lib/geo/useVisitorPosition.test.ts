import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";
import { type LocationResult, locate, wasLocationGranted } from "./location";
import { useVisitorPosition } from "./useVisitorPosition";

vi.mock("./location", () => ({ locate: vi.fn(), wasLocationGranted: vi.fn() }));

const locateMock = vi.mocked(locate);
const grantedMock = vi.mocked(wasLocationGranted);

const lakefront = { latitude: -45.0331, longitude: 168.6597 };
const seoul = { latitude: 37.5665, longitude: 126.978 };

/** An answer from the browser that the test gives by hand. */
function pendingLocation() {
  let resolve!: (result: LocationResult) => void;
  const promise = new Promise<LocationResult>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

beforeEach(() => {
  // A first visit: the browser has not been asked for the position yet.
  grantedMock.mockReset().mockResolvedValue(false);
  locateMock.mockReset().mockResolvedValue({ status: "unavailable" });
});

test("uses a position that was allowed earlier", async () => {
  grantedMock.mockResolvedValue(true);
  locateMock.mockResolvedValue({ status: "inside", position: lakefront });

  const { result } = renderHook(() => useVisitorPosition());

  await waitFor(() => expect(result.current.position).toEqual(lakefront));
  expect(result.current.problem).toBeNull();
});

test("does not ask on arrival", async () => {
  const { result } = renderHook(() => useVisitorPosition());

  await waitFor(() => expect(grantedMock).toHaveBeenCalled());
  expect(locateMock).not.toHaveBeenCalled();
  expect(result.current.position).toBeNull();
  expect(result.current.locating).toBe(false);
});

test("an arrival outside the area says nothing", async () => {
  grantedMock.mockResolvedValue(true);
  locateMock.mockResolvedValue({ status: "outside", position: seoul });

  const { result } = renderHook(() => useVisitorPosition());

  await waitFor(() => expect(locateMock).toHaveBeenCalled());
  expect(result.current.position).toBeNull();
  expect(result.current.problem).toBeNull();
});

test("request reports the position", async () => {
  const answer = pendingLocation();
  locateMock.mockReturnValue(answer.promise);
  const { result } = renderHook(() => useVisitorPosition());

  let asked!: Promise<LocationResult>;
  act(() => {
    asked = result.current.request();
  });
  expect(result.current.locating).toBe(true);

  await act(async () => {
    answer.resolve({ status: "inside", position: lakefront });
    await asked;
  });

  expect(result.current.locating).toBe(false);
  expect(result.current.position).toEqual(lakefront);
  expect(result.current.problem).toBeNull();
  await expect(asked).resolves.toEqual({ status: "inside", position: lakefront });
});

test.each([
  [{ status: "denied" }, "denied"],
  [{ status: "outside", position: seoul }, "outside"],
  [{ status: "unavailable" }, "unavailable"],
] as const)("request reports why there is no position: %o", async (answer, problem) => {
  locateMock.mockResolvedValue(answer);
  const { result } = renderHook(() => useVisitorPosition());

  await act(async () => {
    await result.current.request();
  });

  expect(result.current.problem).toBe(problem);
  expect(result.current.position).toBeNull();
});

test("a failure after a success clears the position", async () => {
  locateMock.mockResolvedValueOnce({ status: "inside", position: lakefront });
  locateMock.mockResolvedValueOnce({ status: "denied" });
  const { result } = renderHook(() => useVisitorPosition());

  await act(async () => {
    await result.current.request();
  });
  expect(result.current.position).toEqual(lakefront);

  await act(async () => {
    await result.current.request();
  });

  // A distance from where the visitor used to be would mislead.
  expect(result.current.position).toBeNull();
  expect(result.current.problem).toBe("denied");
});

test("a success after a failure clears the message", async () => {
  locateMock.mockResolvedValueOnce({ status: "denied" });
  locateMock.mockResolvedValueOnce({ status: "inside", position: lakefront });
  const { result } = renderHook(() => useVisitorPosition());

  await act(async () => {
    await result.current.request();
  });
  await act(async () => {
    await result.current.request();
  });

  expect(result.current.problem).toBeNull();
  expect(result.current.position).toEqual(lakefront);
});

test("dismissProblem clears the message", async () => {
  locateMock.mockResolvedValue({ status: "denied" });
  const { result } = renderHook(() => useVisitorPosition());
  await act(async () => {
    await result.current.request();
  });

  act(() => result.current.dismissProblem());

  expect(result.current.problem).toBeNull();
});

test("an answer that arrives after the screen has gone is dropped", async () => {
  grantedMock.mockResolvedValue(true);
  const answer = pendingLocation();
  locateMock.mockReturnValue(answer.promise);
  const errors = vi.spyOn(console, "error").mockImplementation(() => {});
  const { result, unmount } = renderHook(() => useVisitorPosition());
  await waitFor(() => expect(locateMock).toHaveBeenCalled());

  unmount();
  await act(async () => {
    answer.resolve({ status: "inside", position: lakefront });
    await answer.promise;
  });

  expect(result.current.position).toBeNull();
  expect(errors).not.toHaveBeenCalled();
  errors.mockRestore();
});
