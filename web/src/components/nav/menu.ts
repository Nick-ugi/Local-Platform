export type MenuKey = "map" | "explore" | "local" | "more";

/** The main menu, in display order. Local has no page of its own and opens the notices list. */
export const MENU: readonly { key: MenuKey; href: string }[] = [
  { key: "map", href: "/" },
  { key: "explore", href: "/explore" },
  { key: "local", href: "/notices" },
  { key: "more", href: "/more" },
];

// First path segment -> menu, from docs/02-information-architecture.md section 4.
// A Map, not an object: a path such as /constructor must not match an inherited property.
const MENU_BY_SEGMENT = new Map<string, MenuKey>([
  ["", "map"],
  ["explore", "explore"],
  ["search", "explore"],
  ["places", "explore"],
  ["notices", "local"],
  ["events", "local"],
  ["more", "more"],
  ["about", "more"],
  ["privacy", "more"],
  ["terms", "more"],
  ["login", "more"],
  ["signup", "more"],
  ["favorites", "more"],
]);

/** The menu to highlight for a path, or null when the path belongs to none. */
export function activeMenu(pathname: string): MenuKey | null {
  const firstSegment = pathname.split("/")[1] ?? "";
  return MENU_BY_SEGMENT.get(firstSegment) ?? null;
}
