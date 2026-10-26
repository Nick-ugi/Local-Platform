import { act, render, screen } from "@testing-library/react-native";
import { AppIntlProvider } from "@/i18n/AppIntlProvider";
import { OpenBadge } from "../OpenBadge";

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

/** Renders at a New Zealand time and lets the badge read the clock. */
async function at(iso: string, openingHours: string | null) {
  jest.setSystemTime(new Date(iso));
  const view = render(<OpenBadge openingHours={openingHours} />, { wrapper: AppIntlProvider });
  await act(async () => {
    jest.advanceTimersByTime(0);
  });
  return view;
}

test("open, with the closing time", async () => {
  await at("2026-10-20T10:00:00+13:00", "Mo-Su 09:00-17:00");

  expect(screen.getByText("Open now · until 5:00 pm")).toBeOnTheScreen();
});

test("closing within half an hour", async () => {
  await at("2026-10-20T16:45:00+13:00", "Mo-Su 09:00-17:00");

  expect(screen.getByText("Closes soon · 5:00 pm")).toBeOnTheScreen();
});

test("closed until later today", async () => {
  await at("2026-10-20T07:30:00+13:00", "Mo-Su 09:00-17:00");

  expect(screen.getByText("Closed · opens 9:00 am")).toBeOnTheScreen();
});

test("closed until another day", async () => {
  await at("2026-10-25T20:00:00+13:00", "Mo-Fr 09:00-17:00");

  expect(screen.getByText("Closed · opens Mon 9:00 am")).toBeOnTheScreen();
});

test("open all the time", async () => {
  await at("2026-10-20T03:00:00+13:00", "24/7");

  expect(screen.getByText("Open 24 hours")).toBeOnTheScreen();
});

test("says nothing about hours it cannot read, or no hours", async () => {
  const unreadable = await at("2026-10-20T10:00:00+13:00", "Tu-Su 16:00+");
  expect(unreadable.toJSON()).toBeNull();
  unreadable.unmount();

  const none = await at("2026-10-20T10:00:00+13:00", null);
  expect(none.toJSON()).toBeNull();
});

test("follows the clock", async () => {
  await at("2026-10-20T16:20:00+13:00", "Mo-Su 09:00-17:00");
  expect(screen.getByText("Open now · until 5:00 pm")).toBeOnTheScreen();

  await act(async () => {
    jest.advanceTimersByTime(15 * 60 * 1000);
  });

  expect(screen.getByText("Closes soon · 5:00 pm")).toBeOnTheScreen();
});
