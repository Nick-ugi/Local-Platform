import * as SecureStore from "expo-secure-store";
import {
  addRecent,
  clearRecentPlaces,
  loadRecentPlaces,
  MAX_RECENT,
  type RecentPlace,
  rememberPlace,
} from "../recentPlaces";

function recent(slug: string): RecentPlace {
  return { slug, name: slug, category: "cafe", subtype: null };
}

beforeEach(async () => {
  await SecureStore.deleteItemAsync("recentPlaces");
  jest.mocked(SecureStore.getItemAsync).mockClear();
});

test("a place goes first, once, and the list keeps the last ten", () => {
  expect(MAX_RECENT).toBe(10);
  const list = ["a", "b", "c"].map(recent);

  expect(addRecent(list, recent("d")).map((p) => p.slug)).toEqual(["d", "a", "b", "c"]);
  expect(addRecent(list, recent("b")).map((p) => p.slug)).toEqual(["b", "a", "c"]);

  const full = Array.from({ length: 10 }, (_, i) => recent(`p${i}`));
  const added = addRecent(full, recent("new"));
  expect(added).toHaveLength(10);
  expect(added[0].slug).toBe("new");
  expect(added.map((p) => p.slug)).not.toContain("p9");
});

test("remembers the places seen, latest first, on the phone, and forgets them on Clear", async () => {
  expect(await loadRecentPlaces()).toEqual([]);

  await rememberPlace(recent("harbour-coffee"));
  await rememberPlace(recent("lakeside-kitchen"));
  await rememberPlace(recent("harbour-coffee"));
  expect((await loadRecentPlaces()).map((p) => p.slug)).toEqual(["harbour-coffee", "lakeside-kitchen"]);

  await clearRecentPlaces();
  expect(await loadRecentPlaces()).toEqual([]);
});

test("a stored list that is broken or of another shape reads as none", async () => {
  for (const stored of ["not json", '{"slug":"a"}', '[{"slug":"a"}]', '[{"slug":1,"name":"a","category":"cafe","subtype":null}]']) {
    await SecureStore.setItemAsync("recentPlaces", stored);
    expect(await loadRecentPlaces()).toEqual([]);
  }
});

test("a phone whose storage fails reads as none and remembering does not throw", async () => {
  jest.mocked(SecureStore.getItemAsync).mockRejectedValueOnce(new Error("locked"));
  expect(await loadRecentPlaces()).toEqual([]);

  jest.mocked(SecureStore.setItemAsync).mockRejectedValueOnce(new Error("locked"));
  await expect(rememberPlace(recent("a"))).resolves.toBeUndefined();
});

test("the stored list stays within the 2048 bytes secure storage holds on iOS, dropping the oldest places", async () => {
  // Ten places with the longest names a place can have (120 characters), some of them not ASCII.
  for (let i = 0; i < 10; i++) {
    const name = (i % 2 === 0 ? "a" : "新").repeat(120);
    await rememberPlace({ slug: `place-${i}-${"s".repeat(100)}`, name, category: "food", subtype: null });
  }

  const stored = (await SecureStore.getItemAsync("recentPlaces")) ?? "";
  expect(new TextEncoder().encode(stored).length).toBeLessThanOrEqual(2048);
  const kept = await loadRecentPlaces();
  expect(kept.length).toBeGreaterThan(0);
  expect(kept.length).toBeLessThan(10);
  expect(kept[0].slug.startsWith("place-9-")).toBe(true);
});
