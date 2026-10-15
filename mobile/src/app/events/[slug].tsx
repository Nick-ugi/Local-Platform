import { useLocalSearchParams } from "expo-router";
import { getEvent } from "@/api/events";
import { DetailRoute } from "@/detail/DetailRoute";
import { EventDetailView } from "@/detail/EventDetailView";

/** Event Detail, on top of the Map it was opened from. */
export default function EventRoute() {
  const { slug } = useLocalSearchParams<{ slug: string }>();

  return (
    <DetailRoute kind="event" slug={slug} load={getEvent} titleOf={(event) => event.title}>
      {(event, onViewOnMap) => <EventDetailView event={event} onViewOnMap={onViewOnMap} />}
    </DetailRoute>
  );
}
