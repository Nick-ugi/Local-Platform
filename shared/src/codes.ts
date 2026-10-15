// Code values shared by every client. They are the same strings the API, the URLs and the
// database use (docs/05-erd.md, section 4). codes.test.ts checks them against the backend.

export const CATEGORIES = ['food', 'cafe', 'bar', 'activity', 'shopping', 'facility'] as const
export type Category = (typeof CATEGORIES)[number]

/** True for a category code, which is how a URL segment or a query value is checked. */
export function isCategory(value: string): value is Category {
  return (CATEGORIES as readonly string[]).includes(value)
}

/** Subtypes of the `facility` category. Other categories have no subtype. */
export const FACILITY_SUBTYPES = ['toilet', 'parking', 'information', 'library', 'medical', 'other'] as const
export type FacilitySubtype = (typeof FACILITY_SUBTYPES)[number]

export const NOTICE_TYPES = ['road-work', 'road-closure', 'public-notice', 'emergency'] as const
export type NoticeType = (typeof NOTICE_TYPES)[number]

/** True for a notice type code, which is how a ?type= value is checked. */
export function isNoticeType(value: string): value is NoticeType {
  return (NOTICE_TYPES as readonly string[]).includes(value)
}

/** The spans the event list narrows to (?when=): the New Zealand day, week and month. */
export const EVENT_PERIODS = ['today', 'week', 'month'] as const
export type EventPeriod = (typeof EVENT_PERIODS)[number]

export function isEventPeriod(value: string): value is EventPeriod {
  return (EVENT_PERIODS as readonly string[]).includes(value)
}

export const STATUSES = ['public', 'private'] as const
export type Status = (typeof STATUSES)[number]

export const ERROR_CODES = [
  'VALIDATION_FAILED',
  'INVALID_CREDENTIALS',
  'INVALID_REFRESH_TOKEN',
  'UNAUTHORIZED',
  'FORBIDDEN',
  'NOT_FOUND',
  'METHOD_NOT_ALLOWED',
  'EMAIL_ALREADY_USED',
  'INTERNAL_ERROR',
] as const
export type ErrorCode = (typeof ERROR_CODES)[number]
