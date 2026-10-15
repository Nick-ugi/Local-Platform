import { expect, test } from 'vitest'
import { MAX_QUERY_LENGTH, normalizeQuery } from './search'

test('a missing search parameter is an empty query', () => {
  expect(normalizeQuery(undefined)).toBe('')
  expect(normalizeQuery('   ')).toBe('')
})

test('normalizeQuery trims the words and the gaps between them', () => {
  expect(normalizeQuery('  pizza   bar ')).toBe('pizza bar')
  expect(normalizeQuery('wood\tfired\npizza')).toBe('wood fired pizza')
})

test('normalizeQuery takes the first of a repeated parameter', () => {
  expect(normalizeQuery(['a', 'b'])).toBe('a')
})

test('normalizeQuery cuts a query the API would refuse', () => {
  expect(MAX_QUERY_LENGTH).toBe(100)
  expect(normalizeQuery('x'.repeat(150))).toBe('x'.repeat(100))
  // Cutting must not leave a space at the end, which the API would not count.
  expect(normalizeQuery(`${'x'.repeat(99)} yy`)).toBe('x'.repeat(99))
})
