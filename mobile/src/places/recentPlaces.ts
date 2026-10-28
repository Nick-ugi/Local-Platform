import { CATEGORIES, type PlaceSummary } from "@queenstown/shared";
import * as SecureStore from "expo-secure-store";

// The places the visitor opened lately (README "Later": Recent Place), on the phone only. They are
// kept in the secure storage the app already has, as one small JSON list (about 1 KB for ten), so
// no new native module is needed.

/** What Search shows of a place seen lately, without asking the API again. */
export type RecentPlace = Pick<PlaceSummary, "slug" | "name" | "category" | "subtype">;

export const MAX_RECENT = 10;

const KEY = "recentPlaces";

/** The list with the place first, once, cut to the last ten. */
export function addRecent(list: readonly RecentPlace[], place: RecentPlace): RecentPlace[] {
  return [place, ...list.filter((seen) => seen.slug !== place.slug)].slice(0, MAX_RECENT);
}

function isRecentPlace(value: unknown): value is RecentPlace {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const { slug, name, category, subtype } = value as Record<string, unknown>;
  return (
    typeof slug === "string" &&
    typeof name === "string" &&
    (CATEGORIES as readonly unknown[]).includes(category) &&
    (subtype === null || typeof subtype === "string")
  );
}

/** The places seen lately, latest first. A list that cannot be read is none. */
export async function loadRecentPlaces(): Promise<RecentPlace[]> {
  try {
    const stored = await SecureStore.getItemAsync(KEY);
    const list: unknown = stored === null ? [] : JSON.parse(stored);
    return Array.isArray(list) && list.every(isRecentPlace) ? list : [];
  } catch {
    return [];
  }
}

/** Puts a place first among those seen lately. A phone that cannot store it simply forgets. */
export async function rememberPlace(place: RecentPlace): Promise<void> {
  const { slug, name, category, subtype } = place;
  try {
    await SecureStore.setItemAsync(KEY, JSON.stringify(addRecent(await loadRecentPlaces(), { slug, name, category, subtype })));
  } catch {
    // Nothing is lost but the list.
  }
}

/** Forgets every place seen lately. */
export async function clearRecentPlaces(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(KEY);
  } catch {
    // Nothing more to do.
  }
}
