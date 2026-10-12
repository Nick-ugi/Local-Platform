// Response types of the REST API (docs/06-api-specification.md).

import type { Category, ErrorCode, FacilitySubtype } from './codes'

/** GET /places/{slug} */
export interface PlaceDetail {
  slug: string
  name: string
  category: Category
  subtype: FacilitySubtype | null
  address: string
  imageUrl: string | null
  latitude: number
  longitude: number
  description: string | null
  openingHours: string | null
  phone: string | null
  website: string | null
  source: string
  sourceUrl: string
  /** ISO 8601, UTC */
  updatedAt: string
}

/** One page of a list. Every list endpoint answers in this shape. */
export interface Page<T> {
  items: T[]
  /** Counts from 1. */
  page: number
  size: number
  /** How many items the whole list has. */
  total: number
}

/** A place in the list of GET /places. */
export interface PlaceSummary {
  slug: string
  name: string
  category: Category
  subtype: FacilitySubtype | null
  address: string
  imageUrl: string | null
  latitude: number
  longitude: number
  /** Whole metres from the position the request named, or null when it named none. */
  distanceM: number | null
}

/** The part of the map on screen: longitudes for west and east, latitudes for south and north. */
export interface MapBounds {
  west: number
  south: number
  east: number
  north: number
}

/** A place among the markers of GET /map/markers. */
export interface PlaceMarker {
  kind: 'place'
  slug: string
  latitude: number
  longitude: number
  name: string
  category: Category
  subtype: FacilitySubtype | null
}

/** A marker of any kind. Events and notices join when the map shows them. */
export type MapMarker = PlaceMarker

/** GET /map/markers */
export interface MarkersResponse {
  markers: MapMarker[]
  /** True when the area holds more markers than were sent. */
  truncated: boolean
}

export interface FieldError {
  field: string
  message: string
}

/** Body of every error response (application/problem+json). */
export interface ProblemDetail {
  title: string
  status: number
  detail: string
  instance?: string
  code: ErrorCode
  /** Present only when the input was invalid. */
  errors?: FieldError[]
}
