import type { PlaceDetail } from "@queenstown/shared";
import { useTranslations } from "next-intl";
import { directionsUrl, httpUrl, telHref } from "@/lib/format";
import { ShareButton } from "./ShareButton";

const actionClass =
  "flex min-h-11 w-full items-center justify-center rounded-lg border border-neutral-300 px-2 text-sm font-semibold";

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
