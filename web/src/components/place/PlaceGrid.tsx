import type { PlaceSummary } from "@queenstown/shared";
import { PlaceCard } from "./PlaceCard";

type Props = {
  places: PlaceSummary[];
  /** True while a newer version of the list is on its way. */
  busy?: boolean;
};

/** A list of places: one to a row on a phone, three columns from 768px (m-explore, d-explore). */
export function PlaceGrid({ places, busy = false }: Props) {
  return (
    <ul
      aria-busy={busy}
      className="divide-y divide-neutral-200 aria-busy:opacity-60 md:grid md:grid-cols-3 md:gap-4 md:divide-y-0 md:px-8"
    >
      {places.map((place) => (
        <li key={place.slug}>
          <PlaceCard place={place} />
        </li>
      ))}
    </ul>
  );
}
