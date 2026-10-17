import "mapbox-gl/dist/mapbox-gl.css";
import { SERVICE_CENTER } from "@queenstown/shared";
import type { Map as MapboxMap, Marker } from "mapbox-gl";
import { useEffect, useRef } from "react";

type Props = {
  latitude: number | null;
  longitude: number | null;
  /** Called with the pin's new position when it is dragged or the map is pressed. */
  onChange: (latitude: number, longitude: number) => void;
};

const STYLE = "mapbox://styles/mapbox/standard";

/** Six decimals: about 10 cm, more than a pin can say. */
function round(value: number): number {
  return Math.round(value * 1e6) / 1e6;
}

/**
 * The map of a form (wireframe ad-place-form, 3): a pin to drag, or a press on the map to put it
 * there. The latitude and longitude fields beside it follow the pin, and the pin follows them.
 * Without VITE_MAPBOX_TOKEN there is no map and the fields are typed in.
 */
export function LocationPicker({ latitude, longitude, onChange }: Props) {
  const token = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined;
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<MapboxMap | null>(null);
  const marker = useRef<Marker | null>(null);
  const report = useRef(onChange);
  const position = useRef({ latitude, longitude });

  useEffect(() => {
    report.current = onChange;
    position.current = { latitude, longitude };
  });

  // The map is made once. mapbox-gl is loaded only here, so the lists never download it.
  useEffect(() => {
    if (!token || !container.current) {
      return;
    }
    let gone = false;
    void import("mapbox-gl").then(({ default: mapboxgl }) => {
      if (gone || !container.current) {
        return;
      }
      mapboxgl.accessToken = token;
      const start = position.current;
      const centre: [number, number] =
        start.latitude !== null && start.longitude !== null
          ? [start.longitude, start.latitude]
          : [SERVICE_CENTER.longitude, SERVICE_CENTER.latitude];
      const created = new mapboxgl.Map({ container: container.current, style: STYLE, center: centre, zoom: 15 });
      const pin = new mapboxgl.Marker({ draggable: true });
      pin.on("dragend", () => {
        const { lat, lng } = pin.getLngLat();
        report.current(round(lat), round(lng));
      });
      created.on("click", (event) => report.current(round(event.lngLat.lat), round(event.lngLat.lng)));
      map.current = created;
      marker.current = pin;
      if (start.latitude !== null && start.longitude !== null) {
        pin.setLngLat([start.longitude, start.latitude]).addTo(created);
      }
    });
    return () => {
      gone = true;
      map.current?.remove();
      map.current = null;
      marker.current = null;
    };
  }, [token]);

  // The pin follows the fields: typed values, a press on the map, or a cleared location.
  useEffect(() => {
    const pin = marker.current;
    const current = map.current;
    if (!pin || !current) {
      return;
    }
    if (latitude === null || longitude === null) {
      pin.remove();
      return;
    }
    pin.setLngLat([longitude, latitude]).addTo(current);
    if (!current.getBounds()?.contains([longitude, latitude])) {
      current.easeTo({ center: [longitude, latitude] });
    }
  }, [latitude, longitude]);

  if (!token) {
    return (
      <p className="rounded-lg bg-neutral-100 p-4 text-sm text-neutral-600">
        The map needs VITE_MAPBOX_TOKEN in admin/.env.local. Type the latitude and longitude instead.
      </p>
    );
  }
  return (
    <div
      ref={container}
      role="application"
      aria-label="Map: press to put the pin there, or drag the pin"
      className="h-80 w-full overflow-hidden rounded-xl border border-neutral-300"
    />
  );
}
