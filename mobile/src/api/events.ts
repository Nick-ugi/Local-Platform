import type { EventDetail } from "@queenstown/shared";
import { getDetail } from "./detail";

/** An event, ended or not, or null when there is none for the slug. */
export function getEvent(slug: string, options?: { signal?: AbortSignal }): Promise<EventDetail | null> {
  return getDetail<EventDetail>("events", slug, options);
}
