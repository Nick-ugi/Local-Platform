// The phone's location services do not exist under Jest. A test that cares about the position
// replaces locate() itself; everywhere else the visitor has said no.
jest.mock("expo-location", () => ({
  Accuracy: { Balanced: 3 },
  requestForegroundPermissionsAsync: jest.fn(async () => ({ granted: false, status: "denied" })),
  getCurrentPositionAsync: jest.fn(async () => {
    throw new Error("No location under Jest");
  }),
}));

// The phone's secure storage, as a plain in-memory store. Tests that care read it through the
// module itself.
jest.mock("expo-secure-store", () => {
  const items = new Map();
  return {
    __items: items,
    getItemAsync: jest.fn(async (key) => items.get(key) ?? null),
    setItemAsync: jest.fn(async (key, value) => {
      items.set(key, value);
    }),
    deleteItemAsync: jest.fn(async (key) => {
      items.delete(key);
    }),
  };
});
