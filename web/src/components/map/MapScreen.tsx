"use client";

import {
  distanceMeters,
  type FilterKey,
  filterHides,
  formatDistance,
  keyOf,
  type MapBounds,
  type MapMarker,
  parseFilter,
  parseKey,
  readSelection,
  type Selection,
  serializeFilter,
  toggleFilter,
  writeSelection,
} from "@queenstown/shared";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { getEvent } from "@/lib/api/events";
import { getNotice } from "@/lib/api/notices";
import { getPlace } from "@/lib/api/places";
import { useVisitorPosition } from "@/lib/geo/useVisitorPosition";
import { type Camera, hasSavedCamera, loadCamera, PLACE_ZOOM, saveCamera } from "@/lib/map/camera";
import { useMarkers } from "@/lib/map/useMarkers";
import { FilterChips } from "./FilterChips";
import { LocateButton } from "./LocateButton";
import { MapView } from "./MapView";
import { MarkerPreview } from "./MarkerPreview";

type Action = { label: string; onClick: () => void };

/** How close the map goes when it moves to the visitor. */
const LOCATE_ZOOM = 15;

/** The message for each way of not getting a usable position (docs/03-user-flow.md, UF-01). */
const LOCATION_PROBLEMS = {
  outside: "outsideArea",
  denied: "locationDenied",
  unavailable: "locationUnavailable",
} as const;

/** A short message laid over the map, with at most one thing to do about it. */
function Notice({ text, action }: { text: string; action?: Action }) {
  return (
    <div className="pointer-events-auto flex max-w-full items-center gap-3 rounded-lg bg-white px-4 py-1 text-sm shadow-md">
      <span className="py-2">{text}</span>
      {action ? (
        <button
          type="button"
          onClick={action.onClick}
          className="min-h-11 shrink-0 font-semibold underline underline-offset-2"
        >
          {action.label}
        </button>
      ) : null}
    </div>
  );
}

/** Rewrites the query of the URL in place. history.replaceState keeps useSearchParams in step. */
function writeUrl(change: (params: URLSearchParams) => void) {
  const { pathname, search } = window.location;
  const params = new URLSearchParams(search);
  change(params);
  // A comma means the same escaped or not; unescaped the URL reads as the IA document writes it.
  const query = params.toString().replaceAll("%2C", ",");
  const next = query ? `${pathname}?${query}` : pathname;
  if (next !== pathname + search) {
    window.history.replaceState(null, "", next);
  }
}

/**
 * The marker for a selection the map is not showing, fetched on its own, or null when there is
 * none to show: the place, event or notice is gone, the event or notice has ended (the map shows
 * only current ones), or the notice has no location.
 */
async function lookUp({ kind, slug }: Selection): Promise<MapMarker | null> {
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

/**
 * The Map screen (wireframes m-map, m-map-place, m-map-notice and d-map): the filter chips, the
 * map with its places, events and notices, and the summary card of the selected one.
 *
 * The filter and the selection live in the URL, as ?filter=food,event&event=slug (or ?place=,
 * ?notice=), so the screen can be shared and comes back the same after a visit to a detail page.
 * Changing them replaces the current history entry. The map's position is kept for the tab in
 * session storage.
 *
 * The browser is asked for the visitor's position only when they press the location button. A
 * visitor who allowed it on an earlier visit gets their dot and distances straight away, but the
 * map moves to them only on the button, so a shared link and the way back from a detail page
 * still show the place they are about.
 */
export function MapScreen() {
  const t = useTranslations("Map");
  const searchParams = useSearchParams();
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  const filter = parseFilter(searchParams.get("filter"));
  const selection = readSelection(searchParams);
  const selectedKey = selection ? keyOf(selection) : null;

  const [camera, setCamera] = useState(loadCamera);
  const [bounds, setBounds] = useState<MapBounds | null>(null);
  const [unavailable, setUnavailable] = useState(false);
  const { status, markers, truncated, retry } = useMarkers(bounds, filter);

  const {
    position: userLocation,
    problem: locationProblem,
    locating,
    request: requestLocation,
    dismissProblem: dismissLocationProblem,
  } = useVisitorPosition();

  async function showLocation() {
    const result = await requestLocation();
    // Without a usable position the map stays where it is.
    if (result.status === "inside") {
      setCamera({ ...result.position, zoom: LOCATE_ZOOM });
    }
  }

  // The selected marker is remembered once it has been seen. On a phone the preview makes the map
  // smaller, which can move the marker out of the box; if the preview closed then, the map would
  // grow, the marker would return, and the two would chase each other.
  const [remembered, setRemembered] = useState<MapMarker | null>(null);
  const found = selectedKey === null ? undefined : markers.find((marker) => keyOf(marker) === selectedKey);
  if (found && found !== remembered) {
    setRemembered(found);
  }
  const selected = found ?? (remembered !== null && keyOf(remembered) === selectedKey ? remembered : null);

  // Whether the map had a position of its own before this screen opened. It is read once, here,
  // because the map saves its position as soon as it has loaded.
  const [hadSavedCamera] = useState(hasSavedCamera);

  const gone = useRef(false);
  useEffect(() => {
    gone.current = false;
    return () => {
      gone.current = true;
    };
  }, []);

  // A link can name a place, event or notice the map is not showing: its marker is outside the
  // box, or a filter hides it. It is asked for on its own, once. Its card opens either way; the
  // map moves to it only for a visitor who had not positioned the map, so the way back from a
  // detail page still shows what the visitor left (docs/03-user-flow.md, "뒤로 가기").
  const missing = selection !== null && status === "ready" && selected === null ? selection : null;
  const missingKey = missing ? keyOf(missing) : null;
  const lookedUp = useRef<string | null>(null);
  useEffect(() => {
    const target = missingKey === null ? null : parseKey(missingKey);
    if (target === null || lookedUp.current === missingKey) {
      return;
    }
    lookedUp.current = missingKey;
    lookUp(target).then(
      (marker) => {
        // By now the visitor may have picked something else, or left the screen.
        const named = readSelection(new URLSearchParams(window.location.search));
        if (gone.current || named === null || keyOf(named) !== missingKey) {
          return;
        }
        if (marker === null) {
          writeUrl((params) => writeSelection(params, null));
          return;
        }
        setRemembered(marker);
        if (!hadSavedCamera) {
          setCamera({ latitude: marker.latitude, longitude: marker.longitude, zoom: PLACE_ZOOM });
        }
        // The link is about this marker, so a filter that would hide it gives way.
        writeUrl((params) => {
          if (filterHides(parseFilter(params.get("filter")), marker)) {
            params.delete("filter");
          }
        });
      },
      () => {
        // The map works without this card, and the marker may still be found on it.
      },
    );
  }, [missingKey, hadSavedCamera]);

  function toggle(key: FilterKey) {
    const next = toggleFilter(filter, key);
    const value = serializeFilter(next);
    const hidesSelected = selected !== null && filterHides(next, selected);
    writeUrl((params) => {
      if (value === null) {
        params.delete("filter");
      } else {
        params.set("filter", value);
      }
      if (hidesSelected) {
        writeSelection(params, null);
      }
    });
  }

  function select(key: string | null) {
    if (key === selectedKey) {
      return;
    }
    writeUrl((params) => writeSelection(params, key === null ? null : parseKey(key)));
  }

  function moved(box: MapBounds, position: Camera) {
    setBounds(box);
    saveCamera(position);
    // The visitor has gone on to something else; the message has been read.
    dismissLocationProblem();
  }

  const distanceText = userLocation && selected ? formatDistance(distanceMeters(userLocation, selected)) : null;

  if (!token || unavailable) {
    return (
      <p className="flex flex-1 items-center justify-center p-8 text-center text-neutral-600">{t("notConfigured")}</p>
    );
  }

  const clearFilters = { label: t("clearFilters"), onClick: () => writeUrl((params) => params.delete("filter")) };

  return (
    <div className="flex flex-1 flex-col">
      <FilterChips selected={filter} onToggle={toggle} />
      <div className="relative flex flex-1 flex-col">
        <div className="relative min-h-48 flex-1 bg-neutral-200">
          <MapView
            token={token}
            camera={camera}
            markers={markers}
            selectedKey={selectedKey}
            userLocation={userLocation}
            onMove={moved}
            onSelect={select}
            onUnavailable={() => setUnavailable(true)}
          />
          {/* Messages sit at the top, clear of the preview: centred on a phone, to the right on a desktop. */}
          <div
            role="status"
            className="pointer-events-none absolute inset-x-0 top-3 flex flex-col items-center gap-2 px-4 md:items-end"
          >
            {status === "error" ? <Notice text={t("loadFailed")} action={{ label: t("retry"), onClick: retry }} /> : null}
            {status === "ready" && markers.length === 0 ? (
              <Notice text={t("empty")} action={filter.length > 0 ? clearFilters : undefined} />
            ) : null}
            {status !== "error" && truncated ? <Notice text={t("truncated")} /> : null}
            {locationProblem ? <Notice text={t(LOCATION_PROBLEMS[locationProblem])} /> : null}
          </div>
          {/* Bottom right (wireframe m-map), above Mapbox's attribution line. */}
          <div className="absolute bottom-10 right-4">
            <LocateButton onClick={() => void showLocation()} busy={locating} />
          </div>
        </div>
        {/* Below the map and above the tabs on a phone; floating at the map's top left from 768px. */}
        {selected ? (
          <div className="border-t border-neutral-400 md:absolute md:left-4 md:top-4 md:w-80 md:overflow-hidden md:rounded-xl md:border md:shadow-lg">
            <MarkerPreview marker={selected} distanceText={distanceText} onClose={() => select(null)} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
