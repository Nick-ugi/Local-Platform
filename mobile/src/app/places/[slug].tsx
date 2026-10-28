import { useLocalSearchParams, useRouter } from "expo-router";
import { getPlace } from "@/api/places";
import { FavoriteButton } from "@/auth/FavoriteButton";
import { DetailRoute } from "@/detail/DetailRoute";
import { NearbyPlaces } from "@/detail/NearbyPlaces";
import { PlaceDetailView } from "@/detail/PlaceDetailView";

/** Place Detail, on top of the tab it was opened from. */
export default function PlaceRoute() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();

  return (
    <DetailRoute kind="place" slug={slug} load={getPlace} titleOf={(place) => place.name}>
      {(place, onViewOnMap) => (
        <PlaceDetailView
          place={place}
          onViewOnMap={onViewOnMap}
          favorite={<FavoriteButton slug={place.slug} onNeedLogin={() => router.push("/login")} />}
          nearby={
            <NearbyPlaces place={place} onOpen={(slug) => router.push(`/places/${encodeURIComponent(slug)}`)} />
          }
        />
      )}
    </DetailRoute>
  );
}
