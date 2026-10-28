import type { MapMarker } from '../api'
import type { Category } from '../codes'
import { expect, test } from 'vitest'
import { toFeatureCollection, toLngLat, toPositionCollection } from './geojson'

function marker(slug: string, category: Category): MapMarker {
  return {
    kind: 'place',
    slug,
    latitude: -45.0322,
    longitude: 168.661,
    name: slug,
    category,
    subtype: category === 'facility' ? 'toilet' : null,
    openingHours: null,
  }
}

test('puts longitude first', () => {
  const [feature] = toFeatureCollection([marker('lakeside-kitchen', 'food')]).features

  expect(feature.geometry).toEqual({ type: 'Point', coordinates: [168.661, -45.0322] })
})

test('carries what the layers need', () => {
  const collection = toFeatureCollection([
    marker('a', 'food'),
    marker('b', 'cafe'),
    marker('c', 'bar'),
    marker('d', 'activity'),
    marker('e', 'shopping'),
    marker('f', 'facility'),
  ])

  expect(collection.type).toBe('FeatureCollection')
  expect(collection.features.map((feature) => feature.type)).toEqual(Array(6).fill('Feature'))
  expect(collection.features.map((feature) => feature.properties)).toEqual([
    { key: 'place:a', kind: 'place', label: 'F', color: '#c2410c' },
    { key: 'place:b', kind: 'place', label: 'C', color: '#92400e' },
    { key: 'place:c', kind: 'place', label: 'B', color: '#7c3aed' },
    { key: 'place:d', kind: 'place', label: 'A', color: '#15803d' },
    { key: 'place:e', kind: 'place', label: 'S', color: '#be185d' },
    { key: 'place:f', kind: 'place', label: 'P', color: '#1d4ed8' },
  ])
})

test('marks events and notices apart from places', () => {
  const event: MapMarker = {
    kind: 'event',
    slug: 'a',
    latitude: -45.0331,
    longitude: 168.6597,
    title: 'Market',
    startsAt: '2026-10-09T04:00:00Z',
    endsAt: null,
    venueName: 'Earnslaw Park',
  }
  const notice: MapMarker = {
    kind: 'notice',
    slug: 'a',
    latitude: -45.0312,
    longitude: 168.6626,
    title: 'Works',
    type: 'road-work',
    isOfficial: true,
    startsAt: '2026-10-05T18:00:00Z',
    endsAt: null,
  }

  expect(toFeatureCollection([marker('a', 'food'), event, notice]).features.map((f) => f.properties)).toEqual([
    { key: 'place:a', kind: 'place', label: 'F', color: '#c2410c' },
    { key: 'event:a', kind: 'event', label: 'E', color: '#0e7490' },
    { key: 'notice:a', kind: 'notice', label: '!', color: '#b91c1c' },
  ])
})

test('an empty list is an empty collection', () => {
  expect(toFeatureCollection([])).toEqual({ type: 'FeatureCollection', features: [] })
})

test('writes a position the way the map wants it', () => {
  expect(toLngLat({ latitude: -45.0312, longitude: 168.6626 })).toEqual([168.6626, -45.0312])
})

test('a position is a collection of one point', () => {
  expect(toPositionCollection({ latitude: -45.0312, longitude: 168.6626 })).toEqual({
    type: 'FeatureCollection',
    features: [{ type: 'Feature', geometry: { type: 'Point', coordinates: [168.6626, -45.0312] }, properties: {} }],
  })
})

test('no position is an empty collection', () => {
  expect(toPositionCollection(null)).toEqual({ type: 'FeatureCollection', features: [] })
})
