import { detailPath, type MapMarker } from "@queenstown/shared";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useId } from "react";
import { NoticeBadges } from "@/components/local/NoticeBadges";
import { NoticePeriodText } from "@/components/local/NoticePeriodText";
import { formatEventWhen } from "@/lib/dates";

type Props = {
  marker: MapMarker;
  /** The distance from the visitor, already formatted, or null when their position is unknown. */
  distanceText: string | null;
  onClose: () => void;
};

/**
 * The card of the marker selected on the map (wireframes m-map-place, m-map-notice and d-map),
 * with the way on to its detail page. A place shows its name and category, an event its title,
 * time and venue, a notice its type, Official mark, title and period. The screen decides where
 * the card sits.
 */
export function MarkerPreview({ marker, distanceText, onClose }: Props) {
  const t = useTranslations("Map");
  const tCategory = useTranslations("Category");
  const headingId = useId();

  const distance = distanceText ? (
    <>
      <span aria-hidden="true"> · </span>
      <span>{distanceText}</span>
    </>
  ) : null;

  return (
    <section aria-labelledby={headingId} className="flex items-start gap-2 bg-white p-4">
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        {marker.kind === "notice" ? <NoticeBadges type={marker.type} isOfficial={marker.isOfficial} /> : null}
        <h2 id={headingId} className="text-lg font-bold [overflow-wrap:anywhere]">
          {marker.kind === "place" ? marker.name : marker.title}
        </h2>
        {marker.kind === "place" ? (
          <p className="text-sm text-neutral-600">
            <span>{tCategory(marker.category)}</span>
            {distance}
          </p>
        ) : null}
        {marker.kind === "event" ? (
          <>
            <p className="text-sm text-neutral-600">{formatEventWhen(marker.startsAt, marker.endsAt)}</p>
            <p className="text-sm text-neutral-600">
              <span>{marker.venueName}</span>
              {distance}
            </p>
          </>
        ) : null}
        {marker.kind === "notice" ? (
          <p className="text-sm text-neutral-600">
            <NoticePeriodText startsAt={marker.startsAt} endsAt={marker.endsAt} />
            {distance}
          </p>
        ) : null}
        <Link
          href={detailPath(marker)}
          className="mt-2 flex h-11 items-center justify-center rounded-lg bg-neutral-950 px-4 text-sm font-semibold text-white"
        >
          {t("viewDetails")}
        </Link>
      </div>
      <button
        type="button"
        aria-label={t("closePreview")}
        onClick={onClose}
        className="-mr-2 -mt-2 flex size-11 shrink-0 items-center justify-center text-2xl leading-none text-neutral-600"
      >
        <span aria-hidden="true">×</span>
      </button>
    </section>
  );
}
