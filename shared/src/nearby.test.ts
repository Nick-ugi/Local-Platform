import { expect, test } from 'vitest'
import type { PlaceSummary } from './api'
import { NEARBY_FETCH, pickNearby } from './nearby'

function place(slug: string, distanceM: number | null, category: PlaceSummary['category'] = 'food'): PlaceSummary {
  return {
    slug,
    name: slug,
    category,
    subtype: category === 'facility' ? 'toilet' : null,
    address: 'Queenstown',
    imageUrl: null,
    latitude: -45.0322,
    longitude: 168.661,
    distanceM,
    openingHours: null,
  }
}

test('asks for a dozen, so a few can be left out and five still remain', () => {
  expect(NEARBY_FETCH).toBe(12)
})

test('leaves out the place itself and facilities, and keeps the order', () => {
  const list = [place('kitchen', 0), place('toilet', 20, 'facility'), place('cafe', 40, 'cafe'), place('bar', 90, 'bar')]

  expect(pickNearby(list, { slug: 'kitchen' }).map((p) => p.slug)).toEqual(['cafe', 'bar'])
})

test('keeps five at most', () => {
  const list = ['a', 'b', 'c', 'd', 'e', 'f', 'g'].map((slug, i) => place(slug, 100 * (i + 1)))

  expect(pickNearby(list, { slug: 'x' }).map((p) => p.slug)).toEqual(['a', 'b', 'c', 'd', 'e'])
})

test('leaves out what is over a kilometre away or has no distance', () => {
  const list = [place('near', 1000), place('far', 1001), place('unknown', null)]

  expect(pickNearby(list, { slug: 'x' }).map((p) => p.slug)).toEqual(['near'])
})
