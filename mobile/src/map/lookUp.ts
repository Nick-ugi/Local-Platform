import type { MapMarker, Selection } from "@queenstown/shared";
import { getEvent } from "@/api/events";
import { getNotice } from "@/api/notices";
import { getPlace } from "@/api/places";

/**
 * The marker for a place, event or notice the map is asked to show, fetched on its own, or null
 * when there is none to show: it is gone, the event or notice has ended (the map shows only
 * current ones), or the notice has no location. The web app's rule
 * (web/src/components/map/MapScreen.tsx).
 */
export async function lookUp({ kind, slug }: Selection): Promise<MapMarker | null> {
  if (kind === "place") {
    const place = await getPlace(slug);
    if (!place) {
      return null;
    }
    const { latitude, longitude, name, category, subtype } = place;
    return { kind, slug, latitude, longitude, name, category, subtype };
  }
  if (kind === "event") {
    const event = await getEvent(slug);
    if (!event || event.ended) {
      return null;
    }
    const { latitude, longitude, title, startsAt, endsAt, venueName } = event;
    return { kind, slug, latitude, longitude, title, startsAt, endsAt, venueName };
  }
  const notice = await getNotice(slug);
  if (!notice || notice.ended || notice.latitude === null || notice.longitude === null) {
    return null;
  }
  const { latitude, longitude, title, type, isOfficial, startsAt, endsAt } = notice;
  return { kind, slug, latitude, longitude, title, type, isOfficial, startsAt, endsAt };
}
