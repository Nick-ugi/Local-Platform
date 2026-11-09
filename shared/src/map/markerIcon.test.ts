import { describe, expect, test } from 'vitest'
import type { MapMarker } from '../api'
import { FACILITY_SUBTYPES } from '../codes'
import { MARKER_ICONS, markerIcon, markerImageName } from './markerIcon'

function place(category: Extract<MapMarker, { kind: 'place' }>['category'], subtype: string | null = null): MapMarker {
  return {
    kind: 'place',
    slug: 'a',
    latitude: -45.0322,
    longitude: 168.661,
    name: 'A',
    category,
    subtype: subtype as never,
    openingHours: null,
  }
}

describe('markerIcon', () => {
  test('a place has its category picture, and a facility the picture of its kind', () => {
    expect(['food', 'cafe', 'bar', 'activity', 'shopping'].map((c) => markerIcon(place(c as never)))).toEqual([
      'food',
      'cafe',
      'bar',
      'activity',
      'shopping',
    ])
    expect(FACILITY_SUBTYPES.map((subtype) => markerIcon(place('facility', subtype)))).toEqual([
      'toilet',
      'parking',
      'information',
      'library',
      'medical',
      'facility',
    ])
    expect(markerIcon(place('facility', null))).toBe('facility')
  })

  test('events and notices have their own', () => {
    expect(markerIcon({ kind: 'event' } as MapMarker)).toBe('event')
    expect(markerIcon({ kind: 'notice' } as MapMarker)).toBe('notice')
  })

  test('every picture a marker can have is in the list the maps load', () => {
    const used = new Set([
      ...['food', 'cafe', 'bar', 'activity', 'shopping'].map((c) => markerIcon(place(c as never))),
      ...FACILITY_SUBTYPES.map((subtype) => markerIcon(place('facility', subtype))),
      markerIcon({ kind: 'event' } as MapMarker),
      markerIcon({ kind: 'notice' } as MapMarker),
    ])
    expect([...used].sort()).toEqual([...MARKER_ICONS].sort())
  })

  test('the style knows each picture by a prefixed name', () => {
    expect(markerImageName('food')).toBe('marker-food')
  })
})
