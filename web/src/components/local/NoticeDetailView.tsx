import type { NoticeDetail } from "@queenstown/shared";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { BackLink } from "@/components/nav/BackLink";
import { ShareButton } from "@/components/place/ShareButton";
import { ViewOnMapLink } from "@/components/place/ViewOnMapLink";
import { formatDate, httpUrl } from "@/lib/format";
import { DetailRow, EndedNotice, sideActionClass } from "./DetailParts";
import { NoticeBadges } from "./NoticeBadges";
import { NoticePeriodText } from "./NoticePeriodText";

/**
 * Notice detail (wireframe m-notice; from 768px the two columns of d-place): type and Official,
 * title, period, summary, location with "View on map", the source with "Open original", the date
 * it was updated, and Share. A notice without a location has no Location row. An ended notice
 * says so above its period.
 */
export function NoticeDetailView({ notice }: { notice: NoticeDetail }) {
  const t = useTranslations("Detail");
  const tNav = useTranslations("Nav");
  const tPages = useTranslations("Pages");
  const tPlace = useTranslations("Place");

  const sourceUrl = httpUrl(notice.sourceUrl);
  const position =
    notice.latitude !== null && notice.longitude !== null
      ? { slug: notice.slug, latitude: notice.latitude, longitude: notice.longitude }
      : null;

  return (
    <article className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-4 py-4 [overflow-wrap:anywhere] md:grid md:max-w-5xl md:grid-cols-[minmax(0,1fr)_360px] md:items-start md:gap-x-8 md:px-8 md:py-6">
      <div className="-mb-3 md:hidden">
        <BackLink fallbackHref="/notices" />
      </div>
      <nav aria-label={tPlace("breadcrumb")} className="hidden gap-2 text-sm text-neutral-500 md:col-span-2 md:flex">
        <Link href="/notices">{tNav("local")}</Link>
        <span aria-hidden="true">/</span>
        <Link href="/notices">{tPages("notices")}</Link>
      </nav>

      <div className="flex flex-col gap-5">
        <header className="flex flex-col gap-2">
          <NoticeBadges type={notice.type} isOfficial={notice.isOfficial} />
          <h1 className="text-2xl font-bold">{notice.title}</h1>
        </header>
        {notice.ended ? <EndedNotice text={t("noticeEnded")} /> : null}
        <DetailRow title={t("period")}>
          <p>
            <NoticePeriodText startsAt={notice.startsAt} endsAt={notice.endsAt} />
          </p>
        </DetailRow>
        <p className="whitespace-pre-line">{notice.summary}</p>
      </div>

      <div className="flex flex-col gap-5">
        {position ? (
          <DetailRow
            title={t("location")}
            action={<ViewOnMapLink place={position} kind="notice" className={sideActionClass} />}
          >
            {notice.locationName ? <p>{notice.locationName}</p> : null}
          </DetailRow>
        ) : null}
        <DetailRow
          title={t("source")}
          action={
            sourceUrl ? (
              <a href={sourceUrl} target="_blank" rel="noopener noreferrer" className={sideActionClass}>
                {t("openOriginal")}
                <span aria-hidden="true">&nbsp;↗</span>
                <span className="sr-only"> {t("newTab")}</span>
              </a>
            ) : null
          }
        >
          <p>{notice.sourceOrg}</p>
        </DetailRow>
        <p className="border-t border-neutral-200 pt-4 text-sm text-neutral-500">
          {t("updated", { date: formatDate(notice.updatedAt) })}
        </p>
        <ShareButton
          title={notice.title}
          className="flex min-h-11 w-full items-center justify-center rounded-lg border border-neutral-950 font-semibold"
        />
      </div>
    </article>
  );
}
