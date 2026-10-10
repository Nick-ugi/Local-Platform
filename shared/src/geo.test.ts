import { expect, test } from 'vitest'
import { distanceMeters, formatDistance, isInServiceArea } from './geo'

const centre = { latitude: -45.0312, longitude: 168.6626 }
const nearby = { latitude: -45.0322, longitude: 168.661 } // about 170 m
const frankton = { latitude: -45.0195, longitude: 168.732 } // about 5.6 km
const seoul = { latitude: 37.5665, longitude: 126.978 }

// The ranges are the ones backend/.../SpatialQueryTest.java uses for the same points.
test('distance matches the values PostGIS gave for the same points', () => {
  expect(distanceMeters(centre, centre)).toBe(0)
  expect(distanceMeters(centre, nearby)).toBeGreaterThan(150)
  expect(distanceMeters(centre, nearby)).toBeLessThan(190)
  expect(distanceMeters(centre, frankton)).toBeGreaterThan(5400)
  expect(distanceMeters(centre, frankton)).toBeLessThan(5800)
})

test('distance is the same in both directions', () => {
  expect(distanceMeters(frankton, centre)).toBeCloseTo(distanceMeters(centre, frankton), 6)
  expect(distanceMeters(seoul, centre)).toBeCloseTo(distanceMeters(centre, seoul), 6)
})

test('the service area is 50 km around the centre', () => {
  expect(isInServiceArea(centre)).toBe(true)
  expect(isInServiceArea(frankton)).toBe(true)
  expect(isInServiceArea({ latitude: -45.0312 + 0.44, longitude: 168.6626 })).toBe(true) // about 49 km
  expect(isInServiceArea({ latitude: -45.0312 + 0.46, longitude: 168.6626 })).toBe(false) // about 51 km
  expect(isInServiceArea(seoul)).toBe(false)
})

test.each([
  [0, '0 m'],
  [4, '0 m'],
  [349.6, '350 m'],
  [994, '990 m'],
  [995, '1.0 km'],
  [1234, '1.2 km'],
  [6449, '6.4 km'],
  [9949, '9.9 km'],
  [9950, '10 km'],
  [12345, '12 km'],
])('formats %d m as %s', (meters, text) => {
  expect(formatDistance(meters)).toBe(text)
})
