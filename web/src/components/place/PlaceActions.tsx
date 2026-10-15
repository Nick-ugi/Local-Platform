import type { PlaceDetail } from "@queenstown/shared";
import { useTranslations } from "next-intl";
import { directionsUrl, httpUrl, telHref } from "@/lib/format";
import { ShareButton } from "./ShareButton";

// Four labels share a phone's width (about 80px each), so they get a smaller size and never break
// inside a word, which the article's overflow-wrap would otherwise allow.
const actionClass =
  "flex min-h-11 w-full items-center justify-center rounded-lg border border-neutral-300 px-1 text-[13px] font-semibold [overflow-wrap:normal]";

/**
 * The quick actions of a detail page (PLACE-05): Call, Website, Directions, Share, in equal
 * widths. Call and Website are left out when the place has no number or address that can be
 * linked safely.
 */
export function PlaceActions({ place }: { place: PlaceDetail }) {
  const t = useTranslations("Place");

  const tel = place.phone ? telHref(place.phone) : null;
  const website = place.website ? httpUrl(place.website) : null;

  return (
    <div role="group" aria-label={t("actions")} className="grid auto-cols-fr grid-flow-col gap-2">
      {tel ? (
        <a href={tel} className={actionClass}>
          {t("call")}
        </a>
      ) : null}
      {website ? (
        <a href={website} target="_blank" rel="noopener noreferrer" className={actionClass}>
          {t("website")}
        </a>
      ) : null}
      <a href={directionsUrl(place)} target="_blank" rel="noopener noreferrer" className={actionClass}>
        {t("directions")}
      </a>
      <ShareButton title={place.name} className={actionClass} />
    </div>
  );
}
