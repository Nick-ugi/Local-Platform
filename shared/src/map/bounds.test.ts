import { expect, test } from 'vitest'
import { boundsOf, toMapBounds, wrapLongitude } from './bounds'

test('passes an ordinary box through', () => {
  expect(toMapBounds(168.65, -45.04, 168.67, -45.02)).toEqual({
    west: 168.65,
    south: -45.04,
    east: 168.67,
    north: -45.02,
  })
})

// Dragging the map once round the world leaves it on a copy whose longitudes are 360 higher.
test('brings a box on another copy of the world back', () => {
  const box = toMapBounds(528.65, -45.04, 528.67, -45.02)

  expect(box?.west).toBeCloseTo(168.65, 9)
  expect(box?.east).toBeCloseTo(168.67, 9)
  expect(box?.south).toBe(-45.04)
  expect(box?.north).toBe(-45.02)
})

test('a box wider than the world is the whole world', () => {
  expect(toMapBounds(-250, -60, 250, 60)).toEqual({ west: -180, south: -60, east: 180, north: 60 })
})

test('cuts a box off at the antimeridian', () => {
  expect(toMapBounds(170, -50, 190, -40)).toEqual({ west: 170, south: -50, east: 180, north: -40 })
})

test('keeps latitudes on the globe', () => {
  expect(toMapBounds(160, -95, 170, 95)).toEqual({ west: 160, south: -90, east: 170, north: 90 })
})

test.each([
  ['no width', [168.65, -45.04, 168.65, -45.02]],
  ['no height', [168.65, -45.04, 168.67, -45.04]],
  ['edges the wrong way round', [168.67, -45.02, 168.65, -45.04]],
  ['a value that is not a number', [Number.NaN, -45.04, 168.67, -45.02]],
  ['an infinite value', [168.65, -45.04, Number.POSITIVE_INFINITY, -45.02]],
] as const)('gives no box for %s', (_name, [west, south, east, north]) => {
  expect(toMapBounds(west, south, east, north)).toBeNull()
})

test('wraps a longitude into -180 to 180', () => {
  expect(wrapLongitude(168.6626)).toBe(168.6626)
  expect(wrapLongitude(-180)).toBe(-180)
  expect(wrapLongitude(180)).toBe(-180)
  expect(wrapLongitude(528.5)).toBeCloseTo(168.5, 9)
  expect(wrapLongitude(-191.5)).toBeCloseTo(168.5, 9)
})

test('the box around some points is the smallest that holds them all, and there is none for no points', () => {
  expect(boundsOf([])).toBeNull()
  expect(boundsOf([{ latitude: -45.03, longitude: 168.66 }])).toEqual({
    west: 168.66,
    south: -45.03,
    east: 168.66,
    north: -45.03,
  })
  expect(
    boundsOf([
      { latitude: -45.03, longitude: 168.66 },
      { latitude: -44.94, longitude: 168.83 },
      { latitude: -45.05, longitude: 168.73 },
    ]),
  ).toEqual({ west: 168.66, south: -45.05, east: 168.83, north: -44.94 })
})
