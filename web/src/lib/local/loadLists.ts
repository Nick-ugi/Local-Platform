import {
  type EventPeriod,
  type EventSummary,
  isEventPeriod,
  isNoticeType,
  type NoticeSummary,
  type NoticeType,
  type Page,
} from "@queenstown/shared";
import { getEvents } from "@/lib/api/events";
import { getNotices } from "@/lib/api/notices";
import { parsePage } from "@/lib/places/listUrl";
import { readFilter } from "./listUrl";

type Param = string | string[] | undefined;

/**
 * The page of the notices a URL names, for the server to draw, or null when the URL names none —
 * an unknown type, a page that is not a number or is past the end — and the screen answers 404.
 */
export async function loadNotices(
  typeParam: Param,
  pageParam: Param,
): Promise<{ type: NoticeType | null; result: Page<NoticeSummary> } | null> {
  const type = readFilter(typeParam, isNoticeType);
  const page = parsePage(pageParam);
  if (type === undefined || page === null) {
    return null;
  }
  const result = await getNotices({ type, page });
  return page > 1 && result.items.length === 0 ? null : { type, result };
}

/** The page of the events a URL names, or null when it names none. See {@link loadNotices}. */
export async function loadEvents(
  whenParam: Param,
  pageParam: Param,
): Promise<{ when: EventPeriod | null; result: Page<EventSummary> } | null> {
  const when = readFilter(whenParam, isEventPeriod);
  const page = parsePage(pageParam);
  if (when === undefined || page === null) {
    return null;
  }
  const result = await getEvents({ when, page });
  return page > 1 && result.items.length === 0 ? null : { when, result };
}
