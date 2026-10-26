import { act, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { renderWithMessages } from "@/test/render";
import { OpenBadge } from "./OpenBadge";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

/** Renders at a New Zealand time and lets the badge read the clock. */
async function at(iso: string, openingHours: string | null) {
  vi.setSystemTime(new Date(iso));
  const view = renderWithMessages(<OpenBadge openingHours={openingHours} />);
  await act(async () => {
    vi.advanceTimersByTime(0);
  });
  return view;
}

test("open, with the closing time", async () => {
  await at("2026-10-20T10:00:00+13:00", "Mo-Su 09:00-17:00");

  expect(screen.getByText("Open now · until 5:00 pm")).toBeInTheDocument();
});

test("closing within half an hour", async () => {
  await at("2026-10-20T16:45:00+13:00", "Mo-Su 09:00-17:00");

  expect(screen.getByText("Closes soon · 5:00 pm")).toBeInTheDocument();
});

test("closed until later today, and until another day", async () => {
  await at("2026-10-20T07:30:00+13:00", "Mo-Su 09:00-17:00");
  expect(screen.getByText("Closed · opens 9:00 am")).toBeInTheDocument();
});

test("closed until another day", async () => {
  await at("2026-10-25T20:00:00+13:00", "Mo-Fr 09:00-17:00");

  expect(screen.getByText("Closed · opens Mon 9:00 am")).toBeInTheDocument();
});

test("open all the time", async () => {
  await at("2026-10-20T03:00:00+13:00", "24/7");

  expect(screen.getByText("Open 24 hours")).toBeInTheDocument();
});

test("says nothing about hours it cannot read", async () => {
  const { container } = await at("2026-10-20T10:00:00+13:00", "Tu-Su 16:00+");

  expect(container).toBeEmptyDOMElement();
});

test("follows the clock", async () => {
  await at("2026-10-20T16:20:00+13:00", "Mo-Su 09:00-17:00");
  expect(screen.getByText("Open now · until 5:00 pm")).toBeInTheDocument();

  await act(async () => {
    vi.advanceTimersByTime(15 * 60 * 1000);
  });

  expect(screen.getByText("Closes soon · 5:00 pm")).toBeInTheDocument();
});
