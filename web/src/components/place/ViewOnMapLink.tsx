"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { PLACE_ZOOM, saveCamera } from "@/lib/map/camera";

type Props = {
  place: { slug: string; latitude: number; longitude: number };
  /** What the slug names. The Map selects it by ?place=, ?event= or ?notice=. */
  kind?: "place" | "event" | "notice";
  className?: string;
};

/**
 * "View on map" on a detail page (docs/02-information-architecture.md, "Map의 상태"): the Map
 * screen with this place, event or notice selected.
 *
 * The Map opens where it was last left in this tab. Pressing the link saves the place as that
 * position first, so the map opens on the place with its marker on screen. Where the link is
 * followed without that (a new tab, no scripts) the Map screen looks the place up itself.
 */
export function ViewOnMapLink({ place, kind = "place", className }: Props) {
  const t = useTranslations("Place");

  return (
    <Link
      href={`/?${kind}=${encodeURIComponent(place.slug)}`}
      onClick={() => saveCamera({ latitude: place.latitude, longitude: place.longitude, zoom: PLACE_ZOOM })}
      className={className}
    >
      {t("viewOnMap")}
    </Link>
  );
}
