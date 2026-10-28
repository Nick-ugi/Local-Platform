import type { PlaceDetail } from "@queenstown/shared";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect } from "react";
import { getPlace } from "@/api/places";
import { FavoriteButton } from "@/auth/FavoriteButton";
import { DetailRoute } from "@/detail/DetailRoute";
import { NearbyPlaces } from "@/detail/NearbyPlaces";
import { PlaceDetailView } from "@/detail/PlaceDetailView";
import { rememberPlace } from "@/places/recentPlaces";

/** Place Detail, on top of the tab it was opened from. */
export default function PlaceRoute() {
  const { slug } = useLocalSearchParams<{ slug: string }>();

  return (
    <DetailRoute kind="place" slug={slug} load={getPlace} titleOf={(place) => place.name}>
      {(place, onViewOnMap) => <PlaceScreen place={place} onViewOnMap={onViewOnMap} />}
    </DetailRoute>
  );
}

/** A place that has loaded, which goes first among the places seen lately (Search). */
function PlaceScreen({ place, onViewOnMap }: { place: PlaceDetail; onViewOnMap: () => void }) {
  const router = useRouter();
  const { slug, name, category, subtype } = place;

  useEffect(() => {
    void rememberPlace({ slug, name, category, subtype });
  }, [slug, name, category, subtype]);

  return (
    <PlaceDetailView
      place={place}
      onViewOnMap={onViewOnMap}
      favorite={<FavoriteButton slug={place.slug} onNeedLogin={() => router.push("/login")} />}
      nearby={<NearbyPlaces place={place} onOpen={(near) => router.push(`/places/${encodeURIComponent(near)}`)} />}
    />
  );
}
