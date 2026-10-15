import type { EventDetail } from "@queenstown/shared";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { BackLink } from "@/components/nav/BackLink";
import { PlaceImage } from "@/components/place/PlaceImage";
import { ShareButton } from "@/components/place/ShareButton";
import { ViewOnMapLink } from "@/components/place/ViewOnMapLink";
import { formatEventWhen } from "@/lib/dates";
import { formatDate, httpUrl } from "@/lib/format";
import { DetailRow, EndedNotice, sideActionClass } from "./DetailParts";

/**
 * Event detail (wireframe m-event; from 768px the two columns of d-place): picture, title, when,
 * where with "View on map", description, the official event page, the date it was updated, and
 * Share. An ended event says so under its title.
 *
 * On a phone the two column wrappers are `display: contents` and `order` puts Where right under
 * When, as m-event has it; from 768px Where joins the right column.
 */
export function EventDetailView({ event }: { event: EventDetail }) {
  const t = useTranslations("Detail");
  const tNav = useTranslations("Nav");
  const tPages = useTranslations("Pages");
  const tPlace = useTranslations("Place");

  const sourceUrl = httpUrl(event.sourceUrl);

  return (
    <article className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-4 py-4 [overflow-wrap:anywhere] md:grid md:max-w-5xl md:grid-cols-[minmax(0,1fr)_360px] md:items-start md:gap-x-8 md:px-8 md:py-6">
      <div className="order-1 -mb-3 md:hidden">
        <BackLink fallbackHref="/events" />
      </div>
      <nav aria-label={tPlace("breadcrumb")} className="hidden gap-2 text-sm text-neutral-500 md:col-span-2 md:flex">
        <Link href="/notices">{tNav("local")}</Link>
        <span aria-hidden="true">/</span>
        <Link href="/events">{tPages("events")}</Link>
      </nav>

      <div className="contents md:flex md:flex-col md:gap-5">
        <PlaceImage
          src={event.imageUrl}
          alt={event.title}
          className="order-2 aspect-[16/9] w-full rounded-xl bg-neutral-200 object-cover md:order-none"
        />
        <h1 className="order-3 text-2xl font-bold md:order-none">{event.title}</h1>
        {event.ended ? (
          <div className="order-4 md:order-none">
            <EndedNotice text={t("eventEnded")} />
          </div>
        ) : null}
        <DetailRow title={t("when")} className="order-5">
          <p>{formatEventWhen(event.startsAt, event.endsAt, { year: true })}</p>
        </DetailRow>
        {event.description ? <p className="order-7 whitespace-pre-line md:order-none">{event.description}</p> : null}
      </div>

      <div className="contents md:flex md:flex-col md:gap-5">
        <DetailRow
          title={t("where")}
          className="order-6"
          action={<ViewOnMapLink place={event} kind="event" className={sideActionClass} />}
        >
          <p>{event.venueName}</p>
          {event.address ? <p className="text-sm text-neutral-600">{event.address}</p> : null}
        </DetailRow>
        <DetailRow title={t("source")} className="order-8">
          <p>{event.source}</p>
          {sourceUrl ? (
            <p>
              <a
                href={sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center text-blue-700 underline underline-offset-2"
              >
                {t("eventPage")}
                <span aria-hidden="true">&nbsp;↗</span>
                <span className="sr-only"> {t("newTab")}</span>
              </a>
            </p>
          ) : null}
        </DetailRow>
        <p className="order-9 border-t border-neutral-200 pt-4 text-sm text-neutral-500 md:order-none">
          {t("updated", { date: formatDate(event.updatedAt) })}
        </p>
        <div className="order-10 md:order-none">
          <ShareButton
            title={event.title}
            className="flex min-h-11 w-full items-center justify-center rounded-lg border border-neutral-950 font-semibold"
          />
        </div>
      </div>
    </article>
  );
}
