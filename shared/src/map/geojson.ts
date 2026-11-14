import type { MapMarker, MarkerKind } from '../api'
import { categoryStyle } from '../categoryStyle'
import type { LatLng } from '../geo'
import { markerIcon, markerImageName } from './markerIcon'
import { keyOf } from './selection'

// The API and the app's own types say latitude and longitude. GeoJSON and Mapbox want
// [longitude, latitude]. This file is the one place where the order is turned round.

export type LngLat = [longitude: number, latitude: number]

/** What the map's layers read from each marker. */
export interface MarkerProperties {
  /** "event:lakefront-night-market": slugs are unique within a kind only (selection.ts). */
  key: string
  kind: MarkerKind
  /** The name of the white picture drawn inside the marker (markerIcon.ts). */
  icon: string
  /** The marker's fill: its kind's colour (categoryStyle.ts), the same as its chip's dot. */
  color: string
}

interface PointFeature<P> {
  type: 'Feature'
  geometry: { type: 'Point'; coordinates: LngLat }
  properties: P
}

interface PointCollection<P> {
  type: 'FeatureCollection'
  features: PointFeature<P>[]
}

export type MarkerCollection = PointCollection<MarkerProperties>
export type PositionCollection = PointCollection<Record<string, never>>

export function toLngLat(position: LatLng): LngLat {
  return [position.longitude, position.latitude]
}

/** The markers as GeoJSON for the map. */
export function toFeatureCollection(markers: readonly MapMarker[]): MarkerCollection {
  return {
    type: 'FeatureCollection',
    features: markers.map((marker) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: toLngLat(marker) },
      properties: {
        key: keyOf(marker),
        kind: marker.kind,
        icon: markerImageName(markerIcon(marker)),
        color: categoryStyle(marker.kind === 'place' ? marker : marker.kind).color,
      },
    })),
  }
}

/** One position, such as the visitor's, as GeoJSON. No position is an empty collection. */
export function toPositionCollection(position: LatLng | null): PositionCollection {
  return {
    type: 'FeatureCollection',
    features: position
      ? [{ type: 'Feature', geometry: { type: 'Point', coordinates: toLngLat(position) }, properties: {} }]
      : [],
  }
}
