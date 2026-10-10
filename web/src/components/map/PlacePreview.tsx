import type { PlaceMarker } from "@queenstown/shared";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useId } from "react";

type Props = {
  marker: PlaceMarker;
  /** The distance from the visitor, already formatted, or null when their position is unknown. */
  distanceText: string | null;
  onClose: () => void;
};

/**
 * The card of the place selected on the map (wireframes m-map-place and d-map): name, category
 * and distance, and the way on to the detail page. The screen decides where the card sits.
 */
export function PlacePreview({ marker, distanceText, onClose }: Props) {
  const t = useTranslations("Map");
  const tCategory = useTranslations("Category");
  const headingId = useId();

  return (
    <section aria-labelledby={headingId} className="flex items-start gap-2 bg-white p-4">
      <div className="min-w-0 flex-1">
        <h2 id={headingId} className="text-lg font-bold [overflow-wrap:anywhere]">
          {marker.name}
        </h2>
        <p className="text-sm text-neutral-600">
          <span>{tCategory(marker.category)}</span>
          {distanceText ? (
            <>
              <span aria-hidden="true"> · </span>
              <span>{distanceText}</span>
            </>
          ) : null}
        </p>
        <Link
          href={`/places/${encodeURIComponent(marker.slug)}`}
          className="mt-3 flex h-11 items-center justify-center rounded-lg bg-neutral-950 px-4 text-sm font-semibold text-white"
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
