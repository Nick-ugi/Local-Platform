import { act, fireEvent, render, screen } from "@testing-library/react-native";
import type { ComponentProps } from "react";
import { type LocationResult, locate } from "@/geo/location";
import { AppIntlProvider } from "@/i18n/AppIntlProvider";
import { MapScreen } from "../MapScreen";
import type { MapView } from "../MapView";

// The real map needs the native SDK. This stand-in keeps the props it was given so a test can read
// them and call the map's callbacks.
const map: { props: ComponentProps<typeof MapView> | null } = { props: null };
jest.mock("../MapView", () => ({
  MapView: (props: ComponentProps<typeof MapView>) => {
    map.props = props;
    return null;
  },
}));

jest.mock("@/geo/location", () => ({ locate: jest.fn() }));

const locateMock = jest.mocked(locate);

function mapProps() {
  if (!map.props) {
    throw new Error("the map was not rendered");
  }
  return map.props;
}

/** Opens the screen and lets the position asked for on arrival come back. */
async function openMap(result: LocationResult) {
  locateMock.mockResolvedValue(result);
  render(
    <AppIntlProvider>
      <MapScreen />
    </AppIntlProvider>,
  );
  await act(async () => {});
}

beforeEach(() => {
  process.env.EXPO_PUBLIC_MAPBOX_TOKEN = "pk.test";
  map.props = null;
  locateMock.mockReset();
});

test("without a token there is a notice instead of a map", async () => {
  delete process.env.EXPO_PUBLIC_MAPBOX_TOKEN;

  await openMap({ status: "denied" });

  expect(screen.getByText("The map isn't available right now.")).toBeOnTheScreen();
  expect(map.props).toBeNull();
});

test("a map that cannot start gives way to the notice", async () => {
  await openMap({ status: "denied" });

  act(() => mapProps().onUnavailable());

  expect(screen.getByText("The map isn't available right now.")).toBeOnTheScreen();
});

test("asks for the position as soon as it opens, and starts on Queenstown", async () => {
  locateMock.mockReturnValue(new Promise(() => {}));
  render(
    <AppIntlProvider>
      <MapScreen />
    </AppIntlProvider>,
  );

  expect(locateMock).toHaveBeenCalledTimes(1);
  expect(mapProps().token).toBe("pk.test");
  expect(mapProps().camera).toEqual({ latitude: -45.0312, longitude: 168.6626, zoom: 14 });
  expect(screen.getByRole("button", { name: "Show my location" })).toBeDisabled();
});

test("a position in Queenstown moves the map there and shows it", async () => {
  await openMap({ status: "inside", position: { latitude: -45.0322, longitude: 168.661 } });

  expect(mapProps().camera).toEqual({ latitude: -45.0322, longitude: 168.661, zoom: 15 });
  expect(mapProps().showUserLocation).toBe(true);
  expect(screen.getByRole("button", { name: "Show my location" })).toBeEnabled();
});

test("outside the area the map stays on Queenstown and says why", async () => {
  await openMap({ status: "outside", position: { latitude: 37.5665, longitude: 126.978 } });

  expect(mapProps().camera).toEqual({ latitude: -45.0312, longitude: 168.6626, zoom: 14 });
  expect(mapProps().showUserLocation).toBe(true);
  expect(
    screen.getByText("You're outside the Queenstown area, so the map stays on Queenstown."),
  ).toBeOnTheScreen();
});

test("a refused permission explains how to turn it on", async () => {
  await openMap({ status: "denied" });

  expect(mapProps().showUserLocation).toBe(false);
  expect(screen.getByText(/Turn it on in your phone's settings/)).toBeOnTheScreen();
});

test("no fix says so", async () => {
  await openMap({ status: "unavailable" });

  expect(screen.getByText("We couldn't find your location.")).toBeOnTheScreen();
});

test("the button asks again and goes back to the position", async () => {
  await openMap({ status: "inside", position: { latitude: -45.0322, longitude: 168.661 } });
  const first = mapProps().camera;
  locateMock.mockResolvedValue({ status: "inside", position: { latitude: -45.0322, longitude: 168.661 } });

  fireEvent.press(screen.getByRole("button", { name: "Show my location" }));
  await act(async () => {});

  expect(locateMock).toHaveBeenCalledTimes(2);
  // A new camera, even for the same place, so the map moves back after the visitor panned away.
  expect(mapProps().camera).toEqual(first);
  expect(mapProps().camera).not.toBe(first);
});

test("moving the map with a finger puts the message away", async () => {
  await openMap({ status: "outside", position: { latitude: 37.5665, longitude: 126.978 } });

  act(() => mapProps().onGesture());

  expect(screen.queryByText(/outside the Queenstown area/)).toBeNull();
});
