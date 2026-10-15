import type { EventPeriod, NoticeType } from "@queenstown/shared";
import { withQuery } from "@/lib/api/detail";

// The Local lists are described by their URLs (docs/02-information-architecture.md, "목록의 필터"):
// /notices?type=road-work and /events?when=week, with ?page= as in every list.

/**
 * Reads a one-value filter from the URL: null when it is absent, the value when it is one the
 * list knows, and undefined when it is not, which the screen answers with 404.
 */
export function readFilter<T extends string>(
  value: string | string[] | undefined,
  isValid: (value: string) => value is T,
): T | null | undefined {
  if (value === undefined) {
    return null;
  }
  return typeof value === "string" && isValid(value) ? value : undefined;
}

export function noticesPath(type: NoticeType | null): string {
  return withQuery("/notices", { type });
}

export function eventsPath(when: EventPeriod | null): string {
  return withQuery("/events", { when });
}
