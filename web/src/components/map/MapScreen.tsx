"use client";

import {
  type Category,
  distanceMeters,
  formatDistance,
  type LatLng,
  type MapBounds,
  type MapMarker,
} from "@queenstown/shared";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { locate, wasLocationGranted } from "@/lib/geo/location";
import { type Camera, loadCamera, saveCamera } from "@/lib/map/camera";
import { parseFilter, serializeFilter, toggleFilter } from "@/lib/map/filter";
import { useMarkers } from "@/lib/map/useMarkers";
import { FilterChips } from "./FilterChips";
import { LocateButton } from "./LocateButton";
import { MapView } from "./MapView";
import { PlacePreview } from "./PlacePreview";

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

/**
 * The Map screen (wireframes m-map, m-map-place and d-map): the filter chips, the map and the
 * preview of the selected place.
 *
 * The filter and the selection live in the URL, as ?filter=food,cafe&place=slug, so the screen can
 * be shared and comes back the same after a visit to a detail page. Changing them replaces the
 * current history entry. The map's position is kept for the tab in session storage.
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
  const selectedSlug = searchParams.get("place");

  const [camera, setCamera] = useState(loadCamera);
  const [bounds, setBounds] = useState<MapBounds | null>(null);
  const [unavailable, setUnavailable] = useState(false);
  const { status, markers, truncated, retry } = useMarkers(bounds, filter);

  const [userLocation, setUserLocation] = useState<LatLng | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationProblem, setLocationProblem] = useState<keyof typeof LOCATION_PROBLEMS | null>(null);

  useEffect(() => {
    let gone = false;
    void wasLocationGranted().then(async (granted) => {
      if (!granted) {
        return;
      }
      const result = await locate();
      if (!gone && result.status === "inside") {
        setUserLocation(result.position);
      }
    });
    return () => {
      gone = true;
    };
  }, []);

  async function showLocation() {
    setLocating(true);
    const result = await locate();
    setLocating(false);
    if (result.status === "inside") {
      setUserLocation(result.position);
      setCamera({ ...result.position, zoom: LOCATE_ZOOM });
      setLocationProblem(null);
    } else {
      // The map stays where it is, and distances from an earlier position would mislead.
      setUserLocation(null);
      setLocationProblem(result.status);
    }
  }

  // The selected marker is remembered once it has been seen. On a phone the preview makes the map
  // smaller, which can move the marker out of the box; if the preview closed then, the map would
  // grow, the marker would return, and the two would chase each other.
  const [remembered, setRemembered] = useState<MapMarker | null>(null);
  const found = selectedSlug === null ? undefined : markers.find((marker) => marker.slug === selectedSlug);
  if (found && found !== remembered) {
    setRemembered(found);
  }
  const selected = found ?? (remembered !== null && remembered.slug === selectedSlug ? remembered : null);

  /** Rewrites the query of the URL in place. history.replaceState keeps useSearchParams in step. */
  function writeUrl(change: (params: URLSearchParams) => void) {
    const params = new URLSearchParams(searchParams.toString());
    change(params);
    // A comma means the same escaped or not; unescaped the URL reads as the IA document writes it.
    const query = params.toString().replaceAll("%2C", ",");
    const { pathname } = window.location;
    window.history.replaceState(null, "", query ? `${pathname}?${query}` : pathname);
  }

  function toggle(key: Category) {
    const next = toggleFilter(filter, key);
    const value = serializeFilter(next);
    const hidesSelected = selected !== null && next.length > 0 && !next.includes(selected.category);
    writeUrl((params) => {
      if (value === null) {
        params.delete("filter");
      } else {
        params.set("filter", value);
      }
      if (hidesSelected) {
        params.delete("place");
      }
    });
  }

  function select(slug: string | null) {
    if (slug === selectedSlug) {
      return;
    }
    writeUrl((params) => {
      if (slug === null) {
        params.delete("place");
      } else {
        params.set("place", slug);
      }
    });
  }

  function moved(box: MapBounds, position: Camera) {
    setBounds(box);
    saveCamera(position);
    // The visitor has gone on to something else; the message has been read.
    setLocationProblem(null);
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
            selectedSlug={selectedSlug}
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
            <PlacePreview marker={selected} distanceText={distanceText} onClose={() => select(null)} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
