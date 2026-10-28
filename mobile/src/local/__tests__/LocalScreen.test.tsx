import { type EventSummary, formatEventWhen, type NoticeSummary, type Page } from "@queenstown/shared";
import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { getEvents } from "@/api/events";
import { getNotices } from "@/api/notices";
import { AppIntlProvider } from "@/i18n/AppIntlProvider";
import { LocalScreen } from "../LocalScreen";

jest.mock("@/api/events", () => ({ getEvents: jest.fn() }));
jest.mock("@/api/notices", () => ({ getNotices: jest.fn() }));

const getEventsMock = jest.mocked(getEvents);
const getNoticesMock = jest.mocked(getNotices);

const market: EventSummary = {
  slug: "lakefront-night-market",
  title: "Lakefront Night Market",
  startsAt: "2026-10-30T04:00:00Z",
  endsAt: "2026-10-30T08:00:00Z",
  venueName: "Earnslaw Park",
  imageUrl: null,
  latitude: -45.0318,
  longitude: 168.6602,
};

const works: NoticeSummary = {
  slug: "shotover-street-works",
  title: "Shotover Street resurfacing",
  type: "road-work",
  isOfficial: true,
  startsAt: "2026-10-05T18:00:00Z",
  endsAt: "2026-10-20T05:00:00Z",
};

function onePage<T>(items: T[]): Page<T> {
  return { items, page: 1, size: 20, total: items.length };
}

const onOpen = jest.fn();

async function openLocal() {
  render(<LocalScreen onOpen={onOpen} />, { wrapper: AppIntlProvider });
  await act(async () => {});
}

async function openEvents() {
  await openLocal();
  fireEvent.press(screen.getByRole("tab", { name: "Events" }));
  await act(async () => {});
}

beforeEach(() => {
  onOpen.mockReset();
  getEventsMock.mockReset().mockResolvedValue(onePage([market]));
  getNoticesMock.mockReset().mockResolvedValue(onePage([works]));
});

test("Notices come first and Local opens on them, as on the web", async () => {
  await openLocal();

  expect(screen.getAllByRole("tab").map((tab) => tab.props.accessibilityState?.selected)).toEqual([true, false]);
  expect(screen.getByRole("tab", { name: "Notices" })).toBeSelected();
  expect(getEventsMock).not.toHaveBeenCalled();
});

test("Events, all of them, each with its time in New Zealand and its place, leading to the event", async () => {
  await openEvents();

  expect(screen.getByRole("tab", { name: "Events" })).toBeSelected();
  expect(getEventsMock.mock.lastCall?.[0]).toEqual({ when: null, page: 1 });
  expect(screen.getByRole("button", { name: "All" })).toBeSelected();
  expect(screen.getByText("Lakefront Night Market")).toBeOnTheScreen();
  expect(screen.getByText(formatEventWhen(market.startsAt, market.endsAt))).toBeOnTheScreen();
  expect(screen.getByText("Earnslaw Park")).toBeOnTheScreen();

  fireEvent.press(screen.getByRole("link", { name: /Lakefront Night Market/ }));
  expect(onOpen).toHaveBeenCalledWith("/events/lakefront-night-market");
});

test("the date chips narrow the events", async () => {
  await openEvents();

  for (const name of ["Today", "This Week", "This Month"]) {
    expect(screen.getByRole("button", { name })).not.toBeSelected();
  }
  fireEvent.press(screen.getByRole("button", { name: "This Week" }));
  await act(async () => {});

  expect(getEventsMock.mock.lastCall?.[0]).toEqual({ when: "week", page: 1 });
  expect(screen.getByRole("button", { name: "This Week" })).toBeSelected();
});

test("Notices list the current notices with type, Official and period, narrowed by type, leading to the notice", async () => {
  await openLocal();

  expect(screen.getByRole("tab", { name: "Notices" })).toBeSelected();
  expect(getNoticesMock.mock.lastCall?.[0]).toEqual({ type: null, page: 1 });
  expect(screen.getByRole("button", { name: "All types" })).toBeSelected();
  expect(screen.getByText("Shotover Street resurfacing")).toBeOnTheScreen();
  expect(screen.getByText("Official")).toBeOnTheScreen();
  expect(screen.getByText("6 Oct - 20 Oct 2026")).toBeOnTheScreen();

  fireEvent.press(screen.getByRole("button", { name: "Road Closure" }));
  await act(async () => {});
  expect(getNoticesMock.mock.lastCall?.[0]).toEqual({ type: "road-closure", page: 1 });

  fireEvent.press(screen.getByRole("link", { name: /Shotover Street resurfacing/ }));
  expect(onOpen).toHaveBeenCalledWith("/notices/shotover-street-works");
});

test("an empty period says so and offers all the events", async () => {
  getEventsMock.mockResolvedValue(onePage([]));
  await openEvents();
  expect(screen.getByText("There are no upcoming events.")).toBeOnTheScreen();

  fireEvent.press(screen.getByRole("button", { name: "Today" }));
  await act(async () => {});
  expect(screen.getByText("There are no events in this period.")).toBeOnTheScreen();

  fireEvent.press(screen.getByRole("button", { name: "Show all events" }));
  await act(async () => {});
  expect(screen.getByRole("button", { name: "All" })).toBeSelected();
});

test("a list that fails says so and tries again", async () => {
  getNoticesMock.mockRejectedValueOnce(new Error("offline"));
  await openLocal();
  expect(screen.getByText("We couldn't load the list.")).toBeOnTheScreen();

  fireEvent.press(screen.getByRole("button", { name: "Try again" }));
  await act(async () => {});

  expect(screen.getByText("Shotover Street resurfacing")).toBeOnTheScreen();
});
