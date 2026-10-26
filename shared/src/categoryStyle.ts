import { CATEGORIES, type Category, FACILITY_SUBTYPES, type FacilitySubtype } from './codes'

// One colour and one picture per kind of thing on the map, shared by the web app and the app: the
// markers, the filter chips' dots, and what stands in for a missing photo. Every colour keeps white
// text readable (4.5:1 or more), since markers write their letter in white on it.

export type StyledKind = { category: Category; subtype: FacilitySubtype | null } | 'event' | 'notice'

export interface KindStyle {
  /** #rrggbb */
  color: string
  emoji: string
}

const CATEGORY_STYLE: Record<Exclude<Category, 'facility'>, KindStyle> = {
  food: { color: '#c2410c', emoji: '🍽️' },
  cafe: { color: '#92400e', emoji: '☕' },
  bar: { color: '#7c3aed', emoji: '🍸' },
  activity: { color: '#15803d', emoji: '🏞️' },
  shopping: { color: '#be185d', emoji: '🛍️' },
}

const FACILITY_COLOR = '#1d4ed8'

const FACILITY_EMOJI: Record<FacilitySubtype, string> = {
  toilet: '🚻',
  parking: '🅿️',
  information: 'ℹ️',
  library: '📚',
  medical: '🏥',
  other: '📍',
}

const EVENT_STYLE: KindStyle = { color: '#0e7490', emoji: '🎉' }
// Notices are warnings: road works, closures, emergencies.
const NOTICE_STYLE: KindStyle = { color: '#b91c1c', emoji: '⚠️' }

export function categoryStyle(kind: StyledKind): KindStyle {
  if (kind === 'event') return EVENT_STYLE
  if (kind === 'notice') return NOTICE_STYLE
  if (kind.category === 'facility') {
    return { color: FACILITY_COLOR, emoji: FACILITY_EMOJI[kind.subtype ?? 'other'] }
  }
  return CATEGORY_STYLE[kind.category]
}

/** Every kind with its own style, for checks over all of them. */
export const MARKER_KINDS_STYLED: readonly StyledKind[] = [
  ...CATEGORIES.filter((category) => category !== 'facility').map((category) => ({ category, subtype: null })),
  ...FACILITY_SUBTYPES.map((subtype) => ({ category: 'facility' as const, subtype })),
  'event',
  'notice',
]
