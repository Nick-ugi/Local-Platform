import { categoryStyle, formatDistance, type PlaceSummary } from "@queenstown/shared";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { KindDot } from "./KindArt";

/**
 * "Nearby" at the foot of a place's page (PLACE-08): a few places close to it, each with its kind
 * and distance, as links. Nothing at all when there are none (shared/src/nearby.ts picks them).
 */
export function NearbyList({ places, className = "" }: { places: readonly PlaceSummary[]; className?: string }) {
  const t = useTranslations("Place");
  const tCategory = useTranslations("Category");

  if (places.length === 0) {
    return null;
  }
  return (
    <section
      aria-labelledby="place-nearby"
      className={`${className} flex flex-col gap-1 border-t border-neutral-200 pt-4 md:order-none`}
    >
      <h2 id="place-nearby" className="text-xs font-bold uppercase tracking-wide text-neutral-500">
        {t("nearby")}
      </h2>
      <ul>
        {places.map((place) => (
          <li key={place.slug}>
            <Link
              href={`/places/${encodeURIComponent(place.slug)}`}
              className="flex min-h-11 items-center gap-3 py-2 hover:underline"
            >
              <KindDot color={categoryStyle(place).color} />
              <span className="min-w-0 flex-1">
                <span className="block font-semibold">{place.name}</span>
                <span className="block text-sm text-neutral-600">
                  {place.distanceM === null
                    ? tCategory(place.category)
                    : `${tCategory(place.category)} · ${formatDistance(place.distanceM)}`}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
