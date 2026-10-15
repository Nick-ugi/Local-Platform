// Response types of the REST API (docs/06-api-specification.md).

import type { Category, ErrorCode, FacilitySubtype, NoticeType } from './codes'

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

/** An event in the list of GET /events. Times are ISO 8601, UTC. */
export interface EventSummary {
  slug: string
  title: string
  startsAt: string
  /** Null for an event that lasts until the end of the day it starts on. */
  endsAt: string | null
  venueName: string
  imageUrl: string | null
  latitude: number
  longitude: number
}

/** GET /events/{slug} */
export interface EventDetail extends EventSummary {
  description: string | null
  address: string | null
  source: string
  sourceUrl: string
  updatedAt: string
  /** True once the event is over. Its page stays and says so. */
  ended: boolean
}

/** A notice in the list of GET /notices. Times are ISO 8601, UTC. */
export interface NoticeSummary {
  slug: string
  title: string
  type: NoticeType
  isOfficial: boolean
  startsAt: string
  /** Null for a notice that stays until it is taken down. */
  endsAt: string | null
}

/** GET /notices/{slug}. A notice without a location has null coordinates and locationName. */
export interface NoticeDetail extends NoticeSummary {
  summary: string
  locationName: string | null
  latitude: number | null
  longitude: number | null
  sourceOrg: string
  sourceUrl: string
  updatedAt: string
  ended: boolean
}

/** A detail page in GET /sitemap. */
export interface SitemapEntry {
  slug: string
  updatedAt: string
}

/** GET /sitemap */
export interface SitemapResponse {
  places: SitemapEntry[]
  events: SitemapEntry[]
  notices: SitemapEntry[]
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

/** An event among the markers of GET /map/markers. */
export interface EventMarker {
  kind: 'event'
  slug: string
  latitude: number
  longitude: number
  title: string
  startsAt: string
  endsAt: string | null
  venueName: string
}

/** A notice among the markers of GET /map/markers. Only notices with a location are on the map. */
export interface NoticeMarker {
  kind: 'notice'
  slug: string
  latitude: number
  longitude: number
  title: string
  type: NoticeType
  isOfficial: boolean
  startsAt: string
  endsAt: string | null
}

/** A marker of any kind. Slugs are unique within a kind only, so a marker is told by both. */
export type MapMarker = PlaceMarker | EventMarker | NoticeMarker

export type MarkerKind = MapMarker['kind']

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
