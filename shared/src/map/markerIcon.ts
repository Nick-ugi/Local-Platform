import type { MapMarker } from '../api'
import type { Category, FacilitySubtype } from '../codes'

// The white picture inside each marker, one per kind, as the facility kinds have their own emoji
// (categoryStyle.ts). The pictures are PNG files of the same name in mobile/assets/markers and
// web/public/markers, made from Ionicons by mobile/assets/markers/make-markers.ps1.

export const MARKER_ICONS = [
  'food',
  'cafe',
  'bar',
  'activity',
  'shopping',
  'toilet',
  'parking',
  'information',
  'library',
  'medical',
  'facility',
  'event',
  'notice',
] as const

export type MarkerIcon = (typeof MARKER_ICONS)[number]

/** The files hold three pixels to a point, sharp on every screen. */
export const MARKER_ICON_PIXEL_RATIO = 3

const PLACE_ICONS: Record<Exclude<Category, 'facility'>, MarkerIcon> = {
  food: 'food',
  cafe: 'cafe',
  bar: 'bar',
  activity: 'activity',
  shopping: 'shopping',
}

const FACILITY_ICONS: Record<FacilitySubtype, MarkerIcon> = {
  toilet: 'toilet',
  parking: 'parking',
  information: 'information',
  library: 'library',
  medical: 'medical',
  other: 'facility',
}

export function markerIcon(marker: MapMarker): MarkerIcon {
  if (marker.kind !== 'place') return marker.kind
  if (marker.category === 'facility') return FACILITY_ICONS[marker.subtype ?? 'other']
  return PLACE_ICONS[marker.category]
}

/** The name the map's style knows a picture by. */
export function markerImageName(icon: MarkerIcon): string {
  return `marker-${icon}`
}
