import { act, renderHook } from "@testing-library/react-native";
import type { ReactNode } from "react";
import { type LocationResult, locate } from "../location";
import { useVisitorPosition, VisitorPositionProvider } from "../VisitorPosition";

jest.mock("../location", () => ({ locate: jest.fn() }));

const locateMock = jest.mocked(locate);
const queenstown = { latitude: -45.0322, longitude: 168.661 };
const seoul = { latitude: 37.5665, longitude: 126.978 };

function wrapper({ children }: { children: ReactNode }) {
  return <VisitorPositionProvider>{children}</VisitorPositionProvider>;
}

async function start(first: LocationResult) {
  locateMock.mockResolvedValueOnce(first);
  const hook = renderHook(() => useVisitorPosition(), { wrapper });
  await act(async () => {});
  return hook;
}

beforeEach(() => locateMock.mockReset());

test("asks once when the app starts and is busy until the answer comes", async () => {
  locateMock.mockReturnValue(new Promise(() => {}));

  const { result, rerender } = renderHook(() => useVisitorPosition(), { wrapper });
  rerender({});

  expect(locateMock).toHaveBeenCalledTimes(1);
  expect(result.current.locating).toBe(true);
  expect(result.current.result).toBeNull();
  expect(result.current.position).toBeNull();
  expect(result.current.problem).toBeNull();
});

test("a position inside the area is the visitor's position", async () => {
  const { result } = await start({ status: "inside", position: queenstown });

  expect(result.current.locating).toBe(false);
  expect(result.current.position).toEqual(queenstown);
  expect(result.current.problem).toBeNull();
});

test("a position outside the area is no position, and says why", async () => {
  const { result } = await start({ status: "outside", position: seoul });

  expect(result.current.position).toBeNull();
  expect(result.current.problem).toBe("outside");
  expect(result.current.result).toEqual({ status: "outside", position: seoul });
});

test("a refusal says why", async () => {
  const { result } = await start({ status: "denied" });

  expect(result.current.problem).toBe("denied");
});

test("asking again replaces the answer, and an earlier position does not stay", async () => {
  const { result } = await start({ status: "inside", position: queenstown });
  locateMock.mockResolvedValueOnce({ status: "unavailable" });

  let answer: LocationResult | undefined;
  await act(async () => {
    answer = await result.current.request();
  });

  expect(answer).toEqual({ status: "unavailable" });
  expect(locateMock).toHaveBeenCalledTimes(2);
  expect(result.current.position).toBeNull();
  expect(result.current.problem).toBe("unavailable");
});

test("each answer is a new result, even for the same place", async () => {
  const { result } = await start({ status: "inside", position: queenstown });
  const first = result.current.result;
  locateMock.mockResolvedValueOnce({ status: "inside", position: queenstown });

  await act(async () => {
    await result.current.request();
  });

  expect(result.current.result).toEqual(first);
  expect(result.current.result).not.toBe(first);
});
