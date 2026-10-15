import type { MapMarker } from '../api'
import { expect, test } from 'vitest'
import { detailPath, isSelected, keyOf, parseKey, readSelection, writeSelection } from './selection'

test('reads the selection of any kind', () => {
  expect(readSelection(new URLSearchParams('place=a'))).toEqual({ kind: 'place', slug: 'a' })
  expect(readSelection(new URLSearchParams('filter=event&event=b'))).toEqual({ kind: 'event', slug: 'b' })
  expect(readSelection(new URLSearchParams('notice=c'))).toEqual({ kind: 'notice', slug: 'c' })
  expect(readSelection(new URLSearchParams('filter=food'))).toBeNull()
  expect(readSelection(new URLSearchParams('place='))).toBeNull()
})

test('writing a selection replaces the one before', () => {
  const params = new URLSearchParams('filter=food&place=a')

  writeSelection(params, { kind: 'notice', slug: 'c' })
  expect(params.toString()).toBe('filter=food&notice=c')

  writeSelection(params, null)
  expect(params.toString()).toBe('filter=food')
})

test('a key holds the kind and the slug, and reads back', () => {
  expect(keyOf({ kind: 'event', slug: 'market' })).toBe('event:market')
  expect(parseKey('event:market')).toEqual({ kind: 'event', slug: 'market' })
  expect(parseKey('place:a:b')).toEqual({ kind: 'place', slug: 'a:b' })
  expect(parseKey('market')).toBeNull()
  expect(parseKey('hotel:x')).toBeNull()
  expect(parseKey('place:')).toBeNull()
})

test('a place and an event with the same slug are different markers', () => {
  const place = { kind: 'place', slug: 'market' } as MapMarker
  const event = { kind: 'event', slug: 'market' } as MapMarker

  expect(isSelected(place, { kind: 'event', slug: 'market' })).toBe(false)
  expect(isSelected(event, { kind: 'event', slug: 'market' })).toBe(true)
  expect(isSelected(event, null)).toBe(false)
})

test('each kind has its detail page', () => {
  expect(detailPath({ kind: 'place', slug: 'a b' })).toBe('/places/a%20b')
  expect(detailPath({ kind: 'event', slug: 'market' })).toBe('/events/market')
  expect(detailPath({ kind: 'notice', slug: 'works' })).toBe('/notices/works')
})
