import { act, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { renderWithMessages } from "@/test/render";
import { LoadingState } from "./LoadingState";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

test("says Loading, then after five seconds that the server is waking up", () => {
  renderWithMessages(<LoadingState />);
  expect(screen.getByRole("status")).toHaveTextContent("Loading…");

  act(() => vi.advanceTimersByTime(5000));

  expect(screen.getByRole("status")).toHaveTextContent("Waking up the server… This can take up to a minute.");
});
