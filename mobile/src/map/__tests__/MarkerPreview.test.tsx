import type { EventMarker, PlaceMarker } from "@queenstown/shared";
import { act, render, screen } from "@testing-library/react-native";
import { AppIntlProvider } from "@/i18n/AppIntlProvider";
import { MarkerPreview } from "../MarkerPreview";

const kitchen: PlaceMarker = {
  kind: "place",
  slug: "lakeside-kitchen",
  latitude: -45.0322,
  longitude: 168.661,
  name: "Lakeside Kitchen",
  category: "food",
  subtype: null,
  openingHours: "Mo-Su 09:00-17:00",
};

const market: EventMarker = {
  kind: "event",
  slug: "night-market",
  latitude: -45.0318,
  longitude: 168.6602,
  title: "Night Market",
  startsAt: "2026-10-20T04:00:00Z",
  endsAt: "2026-10-20T08:00:00Z",
  venueName: "Earnslaw Park",
};

const handlers = { onOpen: jest.fn(), onClose: jest.fn() };

beforeEach(() => {
  jest.useFakeTimers();
  // 10 am in Queenstown.
  jest.setSystemTime(new Date("2026-10-20T10:00:00+13:00"));
});

afterEach(() => {
  jest.useRealTimers();
});

async function show(marker: PlaceMarker | EventMarker) {
  render(<MarkerPreview marker={marker} distanceText="350 m" {...handlers} />, { wrapper: AppIntlProvider });
  await act(async () => {
    jest.advanceTimersByTime(0);
  });
}

test("a place's card says whether it is open now, in New Zealand time", async () => {
  await show(kitchen);

  expect(screen.getByText("Lakeside Kitchen")).toBeOnTheScreen();
  expect(screen.getByText("Food · 350 m")).toBeOnTheScreen();
  expect(screen.getByText("Open now · until 5:00 pm")).toBeOnTheScreen();
});

test("a place without hours, and an event, have no badge", async () => {
  await show({ ...kitchen, openingHours: null });
  expect(screen.queryByText(/Open now|Closed|Closes soon|Open 24 hours/)).toBeNull();
  screen.unmount();

  await show(market);
  expect(screen.queryByText(/Open now|Closed|Closes soon|Open 24 hours/)).toBeNull();
});
