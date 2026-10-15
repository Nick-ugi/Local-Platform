import { useLocalSearchParams } from "expo-router";
import { getPlace } from "@/api/places";
import { DetailRoute } from "@/detail/DetailRoute";
import { PlaceDetailView } from "@/detail/PlaceDetailView";

/** Place Detail, on top of the tab it was opened from. */
export default function PlaceRoute() {
  const { slug } = useLocalSearchParams<{ slug: string }>();

  return (
    <DetailRoute kind="place" slug={slug} load={getPlace} titleOf={(place) => place.name}>
      {(place, onViewOnMap) => <PlaceDetailView place={place} onViewOnMap={onViewOnMap} />}
    </DetailRoute>
  );
}
