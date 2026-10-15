// The phone's location services do not exist under Jest. A test that cares about the position
// replaces locate() itself; everywhere else the visitor has said no.
jest.mock("expo-location", () => ({
  Accuracy: { Balanced: 3 },
  requestForegroundPermissionsAsync: jest.fn(async () => ({ granted: false, status: "denied" })),
  getCurrentPositionAsync: jest.fn(async () => {
    throw new Error("No location under Jest");
  }),
}));
