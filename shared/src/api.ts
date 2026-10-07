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
