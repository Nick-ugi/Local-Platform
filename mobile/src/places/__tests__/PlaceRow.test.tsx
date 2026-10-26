import type { PlaceSummary } from "@queenstown/shared";
import { act, render, screen } from "@testing-library/react-native";
import { StyleSheet } from "react-native";
import { AppIntlProvider } from "@/i18n/AppIntlProvider";
import { PlaceRow } from "../PlaceRow";

const coffee: PlaceSummary = {
  slug: "harbour-coffee",
  name: "Harbour Coffee",
  category: "cafe",
  subtype: null,
  address: "5 Marine Parade",
  imageUrl: null,
  latitude: -45.0335,
  longitude: 168.659,
  distanceM: null,
  openingHours: "Mo-Su 07:00-16:00",
};

beforeEach(() => {
  jest.useFakeTimers();
  // 10 am in Queenstown.
  jest.setSystemTime(new Date("2026-10-20T10:00:00+13:00"));
});

afterEach(() => {
  jest.useRealTimers();
});

async function show(place: PlaceSummary) {
  render(<PlaceRow place={place} onPress={jest.fn()} />, { wrapper: AppIntlProvider });
  await act(async () => {
    jest.advanceTimersByTime(0);
  });
}

test("a place without a picture shows its kind's colour and picture instead, hidden from screen readers", async () => {
  await show(coffee);

  const placeholder = screen.getByTestId("image-placeholder", { includeHiddenElements: true });
  expect(StyleSheet.flatten(placeholder.props.style)).toMatchObject({ backgroundColor: "#92400e1a" });
  expect(placeholder).toHaveTextContent("☕");
  expect(placeholder).not.toBeVisible();
});

test("a facility's picture follows its subtype", async () => {
  await show({ ...coffee, category: "facility", subtype: "toilet", openingHours: null });

  expect(screen.getByTestId("image-placeholder", { includeHiddenElements: true })).toHaveTextContent("🚻");
});

test("says whether the place is open now, under the address", async () => {
  await show(coffee);

  expect(screen.getByText("Open now · until 4:00 pm")).toBeOnTheScreen();
});

test("a place without readable hours has no badge", async () => {
  await show({ ...coffee, openingHours: "Mon-Sun 7:00 am - 4:00 pm" });

  expect(screen.queryByText(/Open now|Closed|Closes soon/)).toBeNull();
});
