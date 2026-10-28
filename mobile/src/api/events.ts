import type { EventDetail, EventPeriod, EventSummary, Page } from "@queenstown/shared";
import { apiGet } from "./client";
import { getDetail, queryString } from "./detail";

/** An event, ended or not, or null when there is none for the slug. */
export function getEvent(slug: string, options?: { signal?: AbortSignal }): Promise<EventDetail | null> {
  return getDetail<EventDetail>("events", slug, options);
}

/** One page of the events that are on or to come, earliest first, in a period if one is named (EVENT-01, EVENT-02). */
export function getEvents(
  query: { when?: EventPeriod | null; page?: number },
  options?: { signal?: AbortSignal },
): Promise<Page<EventSummary>> {
  const search = queryString({
    when: query.when,
    page: query.page !== undefined && query.page > 1 ? query.page : null,
  });
  return apiGet<Page<EventSummary>>(`/events${search}`, options);
}
