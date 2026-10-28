import { expect, test } from 'vitest'
import type { PlaceSummary } from '../api'
import { placeMarkerOf } from './marker'

test('a place from a list becomes its marker, with what the map card shows', () => {
  const place: PlaceSummary = {
    slug: 'harbour-coffee',
    name: 'Harbour Coffee',
    category: 'cafe',
    subtype: null,
    address: '5 Marine Parade, Queenstown',
    imageUrl: null,
    latitude: -45.0335,
    longitude: 168.659,
    distanceM: 120,
    openingHours: 'Mo-Su 07:00-16:00',
  }

  expect(placeMarkerOf(place)).toEqual({
    kind: 'place',
    slug: 'harbour-coffee',
    latitude: -45.0335,
    longitude: 168.659,
    name: 'Harbour Coffee',
    category: 'cafe',
    subtype: null,
    openingHours: 'Mo-Su 07:00-16:00',
  })
})
