import {
  EVENT_PERIODS,
  type EventPeriod,
  type EventSummary,
  NOTICE_TYPES,
  type NoticeSummary,
  type NoticeType,
  type Page,
} from "@queenstown/shared";
import Link from "next/link";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { Pagination } from "@/components/place/Pagination";
import { eventsPath, noticesPath } from "@/lib/local/listUrl";
import { pageCount } from "@/lib/places/listUrl";
import { EventCard } from "./EventCard";
import { FilterLinks } from "./FilterLinks";
import { LocalTabs } from "./LocalTabs";
import { NoticeCard } from "./NoticeCard";

/** The frame of both lists: one 760px column from 768px up (d-notices). */
function LocalFrame({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mx-auto flex w-full max-w-[760px] flex-1 flex-col md:py-6">
      <h1 className="sr-only">{title}</h1>
      {children}
    </div>
  );
}

/** An empty list says so, and offers to drop the filter that emptied it. */
function Empty({ text, clear }: { text: string; clear?: { label: string; href: string } }) {
  return (
    <div className="flex flex-col items-center gap-3 px-4 py-10 text-center text-neutral-600">
      <p>{text}</p>
      {clear ? (
        <Link href={clear.href} className="flex h-11 items-center font-semibold text-neutral-950 underline">
          {clear.label}
        </Link>
      ) : null}
    </div>
  );
}

/**
 * Local - Notices (wireframes m-notices and d-notices, NOTICE-01, NOTICE-06): the notices that
 * have not ended, latest first, narrowed to one type if one is chosen.
 */
export function NoticesScreen({ type, result }: { type: NoticeType | null; result: Page<NoticeSummary> }) {
  const t = useTranslations("Local");
  const tType = useTranslations("NoticeType");
  const tPages = useTranslations("Pages");

  const filters = [
    { key: "all", label: t("allTypes"), href: noticesPath(null), active: type === null },
    ...NOTICE_TYPES.map((key) => ({ key, label: tType(key), href: noticesPath(key), active: key === type })),
  ];

  return (
    <LocalFrame title={tPages("notices")}>
      <LocalTabs active="notices" />
      <FilterLinks label={t("noticeTypes")} items={filters} />
      {result.items.length === 0 ? (
        <Empty
          text={t(type === null ? "noNotices" : "noNoticesOfType")}
          clear={type === null ? undefined : { label: t("showAllTypes"), href: noticesPath(null) }}
        />
      ) : (
        <ul className="divide-y divide-neutral-200 border-y border-neutral-200">
          {result.items.map((notice) => (
            <li key={notice.slug}>
              <NoticeCard notice={notice} />
            </li>
          ))}
        </ul>
      )}
      <Pagination path={noticesPath(type)} page={result.page} pages={pageCount(result.total, result.size)} />
    </LocalFrame>
  );
}

/**
 * Local - Events (wireframe m-events, EVENT-01, EVENT-02): the events that are on or to come,
 * earliest first, narrowed to today, this week or this month if one is chosen.
 */
export function EventsScreen({ when, result }: { when: EventPeriod | null; result: Page<EventSummary> }) {
  const t = useTranslations("Local");
  const tPages = useTranslations("Pages");

  const filters = [
    { key: "all", label: t("all"), href: eventsPath(null), active: when === null },
    ...EVENT_PERIODS.map((key) => ({ key, label: t(key), href: eventsPath(key), active: key === when })),
  ];

  return (
    <LocalFrame title={tPages("events")}>
      <LocalTabs active="events" />
      <FilterLinks label={t("eventPeriods")} items={filters} />
      {result.items.length === 0 ? (
        <Empty
          text={t(when === null ? "noEvents" : "noEventsInPeriod")}
          clear={when === null ? undefined : { label: t("showAllEvents"), href: eventsPath(null) }}
        />
      ) : (
        <ul className="divide-y divide-neutral-200 border-y border-neutral-200">
          {result.items.map((event) => (
            <li key={event.slug}>
              <EventCard event={event} />
            </li>
          ))}
        </ul>
      )}
      <Pagination path={eventsPath(when)} page={result.page} pages={pageCount(result.total, result.size)} />
    </LocalFrame>
  );
}
