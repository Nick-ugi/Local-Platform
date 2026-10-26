import { formatDistance, type PlaceSummary } from "@queenstown/shared";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { OpenBadge } from "./OpenBadge";
import { PlaceImage } from "./PlaceImage";

// A small picture at the left on a phone, a wide one on top from 768px (m-explore, d-explore).
const imageClass = "size-20 shrink-0 rounded-lg object-cover md:h-36 md:w-full md:rounded-none";

/**
 * A place in a list (wireframes m-explore and d-explore): picture, name, category with the
 * distance, address. The whole card is the link to the detail page. The distance is there only
 * when the list was ordered from the visitor's position.
 */
export function PlaceCard({ place }: { place: PlaceSummary }) {
  const tCategory = useTranslations("Category");

  return (
    <Link
      href={`/places/${encodeURIComponent(place.slug)}`}
      className="flex h-full min-h-11 items-center gap-3 px-4 py-3 md:flex-col md:items-stretch md:gap-0 md:overflow-hidden md:rounded-xl md:border md:border-neutral-300 md:p-0"
    >
      {/* The name is right beside the picture, so the picture itself says nothing more. */}
      <PlaceImage
        src={place.imageUrl}
        alt=""
        className={imageClass}
        fallback={<div data-slot="image-placeholder" aria-hidden="true" className={`${imageClass} bg-neutral-200`} />}
      />
      <div className="min-w-0 flex-1 [overflow-wrap:anywhere] md:p-3">
        <h2 className="font-bold">{place.name}</h2>
        <p className="text-sm text-neutral-600">
          <span>{tCategory(place.category)}</span>
          {place.distanceM !== null ? (
            <>
              <span aria-hidden="true"> · </span>
              <span>{formatDistance(place.distanceM)}</span>
            </>
          ) : null}
        </p>
        <p className="text-sm text-neutral-600">{place.address}</p>
        <OpenBadge openingHours={place.openingHours} className="mt-1" />
      </div>
    </Link>
  );
}
