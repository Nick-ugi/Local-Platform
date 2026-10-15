import type { MapMarker, MarkerKind } from "@queenstown/shared";

// The Map's selection lives in the URL as ?place=, ?event= or ?notice= (docs/02-information-
// architecture.md, "Map의 상태"). Slugs are unique within a kind only, so the map tells markers
// apart by a key that holds both: "event:lakefront-night-market".

export const MARKER_KINDS: readonly MarkerKind[] = ["place", "event", "notice"];

export interface Selection {
  kind: MarkerKind;
  slug: string;
}

/** The selection a URL names. Should a URL name more than one, the first kind in MARKER_KINDS wins. */
export function readSelection(params: URLSearchParams): Selection | null {
  for (const kind of MARKER_KINDS) {
    const slug = params.get(kind);
    if (slug) {
      return { kind, slug };
    }
  }
  return null;
}

/** Puts the selection in the URL parameters, replacing any other. Null clears it. */
export function writeSelection(params: URLSearchParams, selection: Selection | null): void {
  for (const kind of MARKER_KINDS) {
    params.delete(kind);
  }
  if (selection) {
    params.set(selection.kind, selection.slug);
  }
}

export function keyOf(marker: { kind: MarkerKind; slug: string }): string {
  return `${marker.kind}:${marker.slug}`;
}

/** The selection a marker key stands for, or null for something that is not one. */
export function parseKey(key: string): Selection | null {
  const at = key.indexOf(":");
  const kind = key.slice(0, at);
  const slug = key.slice(at + 1);
  return at > 0 && slug && (MARKER_KINDS as readonly string[]).includes(kind)
    ? { kind: kind as MarkerKind, slug }
    : null;
}

export function isSelected(marker: MapMarker, selection: Selection | null): boolean {
  return selection !== null && marker.kind === selection.kind && marker.slug === selection.slug;
}

/** The detail page of a marker. */
export function detailPath(marker: { kind: MarkerKind; slug: string }): string {
  const collection = { place: "places", event: "events", notice: "notices" }[marker.kind];
  return `/${collection}/${encodeURIComponent(marker.slug)}`;
}
