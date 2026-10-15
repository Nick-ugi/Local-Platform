import * as Location from "expo-location";
import { locate } from "../location";

const permission = jest.mocked(Location.requestForegroundPermissionsAsync);
const position = jest.mocked(Location.getCurrentPositionAsync);

function at(latitude: number, longitude: number) {
  return { coords: { latitude, longitude } } as Location.LocationObject;
}

beforeEach(() => {
  permission.mockResolvedValue({ granted: true } as Location.LocationPermissionResponse);
});

test("a position in Queenstown is inside", async () => {
  position.mockResolvedValue(at(-45.0322, 168.661));

  await expect(locate()).resolves.toEqual({ status: "inside", position: { latitude: -45.0322, longitude: 168.661 } });
});

test("a position in Seoul is outside, and still a position", async () => {
  position.mockResolvedValue(at(37.5665, 126.978));

  await expect(locate()).resolves.toEqual({ status: "outside", position: { latitude: 37.5665, longitude: 126.978 } });
});

test("a refused permission is denied, without asking for the position", async () => {
  permission.mockResolvedValue({ granted: false } as Location.LocationPermissionResponse);
  position.mockClear();

  await expect(locate()).resolves.toEqual({ status: "denied" });
  expect(position).not.toHaveBeenCalled();
});

test("no fix is unavailable", async () => {
  position.mockRejectedValue(new Error("Location services are disabled"));

  await expect(locate()).resolves.toEqual({ status: "unavailable" });
});
