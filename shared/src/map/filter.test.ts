import { expect, test } from 'vitest'
import type { MapMarker } from '../api'
import { filterHides, parseFilter, serializeFilter, toggleFilter } from './filter'

test('reads the filter from the URL value', () => {
  expect(parseFilter('food,cafe')).toEqual(['food', 'cafe'])
})

test('keeps the category order whatever the URL order', () => {
  expect(parseFilter('cafe,food')).toEqual(['food', 'cafe'])
})

test('drops unknown values and repeats', () => {
  expect(parseFilter('food,hotel,food,,places')).toEqual(['food'])
})

test('reads events and notices after the categories', () => {
  expect(parseFilter('notice,event,cafe')).toEqual(['cafe', 'event', 'notice'])
})

test('reads nothing from a missing or empty value', () => {
  expect(parseFilter(null)).toEqual([])
  expect(parseFilter('')).toEqual([])
})

test('writes the filter for the URL', () => {
  expect(serializeFilter(['food', 'cafe'])).toBe('food,cafe')
  expect(serializeFilter([])).toBeNull()
})

test('toggling adds and removes', () => {
  expect(toggleFilter(['food'], 'cafe')).toEqual(['food', 'cafe'])
  expect(toggleFilter(['food', 'cafe'], 'food')).toEqual(['cafe'])
})

test('toggling keeps the category order', () => {
  expect(toggleFilter(['cafe', 'shopping'], 'food')).toEqual(['food', 'cafe', 'shopping'])
})

test('toggling an event or notice chip keeps the chip order', () => {
  expect(toggleFilter(['notice'], 'food')).toEqual(['food', 'notice'])
  expect(toggleFilter(['food', 'notice'], 'event')).toEqual(['food', 'event', 'notice'])
})

test('a filter hides the markers whose chip is off', () => {
  const place = { kind: 'place', category: 'food' } as MapMarker
  const event = { kind: 'event' } as MapMarker

  expect(filterHides([], place)).toBe(false)
  expect(filterHides(['food'], place)).toBe(false)
  expect(filterHides(['cafe'], place)).toBe(true)
  expect(filterHides(['event'], event)).toBe(false)
  expect(filterHides(['food', 'notice'], event)).toBe(true)
})
