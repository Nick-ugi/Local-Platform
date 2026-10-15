import type { EventDetail, EventPeriod, EventSummary, Page } from "@queenstown/shared";
import { apiGet } from "./client";
import { getDetail, withQuery } from "./detail";

/** A public event, ended or not, or null when there is none for the slug. */
export function getEvent(slug: string): Promise<EventDetail | null> {
  return getDetail<EventDetail>("events", slug);
}

/** One page of the events that are on or to come, earliest first, within the period if one is given. */
export function getEvents(query: { when?: EventPeriod | null; page?: number }): Promise<Page<EventSummary>> {
  return apiGet<Page<EventSummary>>(withQuery("/events", { when: query.when, page: query.page }));
}
