type NavigationLike = { currentEntry?: { index: number } | null };

/**
 * True when the previous history entry belongs to this site. The browser's Navigation API lists
 * only the site's own contiguous entries, so index 0 means the visitor came from somewhere else
 * or opened the page directly. Browsers without the API report false.
 */
export function canGoBackInApp(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  const navigation = (window as unknown as { navigation?: NavigationLike }).navigation;
  return (navigation?.currentEntry?.index ?? 0) > 0;
}
