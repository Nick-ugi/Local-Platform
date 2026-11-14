import { directionsUrl, httpUrl, type PlaceDetail, telHref } from "@queenstown/shared";
import { useTranslations } from "next-intl";
import { Icon } from "@/components/ui/Icon";
import { ShareButton } from "./ShareButton";

// Four labels share a phone's width (about 80px each), so they get a smaller size and never break
// inside a word, which the article's overflow-wrap would otherwise allow. Each has its icon above.
const actionClass =
  "flex min-h-16 w-full flex-col items-center justify-center gap-1 rounded-xl bg-brand-soft px-1 py-2 text-[13px] font-semibold text-brand hover:bg-sky-200 [overflow-wrap:normal]";

const iconClass = "size-[22px]";

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
          <Icon name="phone" className={iconClass} />
          {t("call")}
        </a>
      ) : null}
      {website ? (
        <a href={website} target="_blank" rel="noopener noreferrer" className={actionClass}>
          <Icon name="globe" className={iconClass} />
          {t("website")}
        </a>
      ) : null}
      <a href={directionsUrl(place)} target="_blank" rel="noopener noreferrer" className={actionClass}>
        <Icon name="navigate" className={iconClass} />
        {t("directions")}
      </a>
      <ShareButton title={place.name} className={actionClass} icon={<Icon name="share" className={iconClass} />} />
    </div>
  );
}
