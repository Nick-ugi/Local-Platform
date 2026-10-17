import { readFileSync } from 'node:fs'
import { expect, test } from 'vitest'
import {
  CATEGORIES,
  ERROR_CODES,
  EVENT_PERIODS,
  FACILITY_SUBTYPES,
  NOTICE_TYPES,
  STATUSES,
  isCategory,
  isEventPeriod,
  isNoticeType,
} from './codes'
import { SERVICE_CENTER, SERVICE_RADIUS_KM } from './geo'

// The code values live in three places: here, the DB constraints and the backend's Java code.
// These tests fail when one of them changes without the others.
const backend = new URL('../../backend/src/main/', import.meta.url)
const schema = readFileSync(new URL('resources/db/migration/V1__init_schema.sql', backend), 'utf8')
const errorCodeJava = readFileSync(
  new URL('java/com/queenstownlocal/backend/common/error/ErrorCode.java', backend),
  'utf8',
)
const placeCategoryJava = readFileSync(
  new URL('java/com/queenstownlocal/backend/place/PlaceCategory.java', backend),
  'utf8',
)

/** The quoted values of the first IN (...) list of a CHECK constraint. */
function constraintValues(name: string): string[] {
  const start = schema.indexOf(`CONSTRAINT ${name} CHECK (`)
  if (start < 0) throw new Error(`constraint not found: ${name}`)
  const listStart = schema.indexOf('IN (', start)
  const list = schema.slice(listStart, schema.indexOf(')', listStart))
  return [...list.matchAll(/'([^']+)'/g)].map((match) => match[1])
}

test('categories match the place category constraint', () => {
  expect(constraintValues('ck_place_category')).toEqual([...CATEGORIES])
})

test('categories match the backend list', () => {
  const listStart = placeCategoryJava.indexOf('List.of(')
  const list = placeCategoryJava.slice(listStart, placeCategoryJava.indexOf(')', listStart))
  const javaCodes = [...list.matchAll(/"([^"]+)"/g)].map((match) => match[1])

  expect(javaCodes).toEqual([...CATEGORIES])
})

test('facility subtypes match the place subtype constraint', () => {
  expect(constraintValues('ck_place_subtype')).toEqual([...FACILITY_SUBTYPES])
})

test('facility subtypes match the backend list', () => {
  const subtypeJava = readFileSync(
    new URL('java/com/queenstownlocal/backend/place/FacilitySubtype.java', backend),
    'utf8',
  )
  const listStart = subtypeJava.indexOf('List.of(')
  const list = subtypeJava.slice(listStart, subtypeJava.indexOf(')', listStart))

  expect([...list.matchAll(/"([^"]+)"/g)].map((match) => match[1])).toEqual([...FACILITY_SUBTYPES])
})

test('notice types match the notice type constraint', () => {
  expect(constraintValues('ck_notice_type')).toEqual([...NOTICE_TYPES])
})

test('notice types match the backend list', () => {
  const noticeTypeJava = readFileSync(
    new URL('java/com/queenstownlocal/backend/notice/NoticeType.java', backend),
    'utf8',
  )
  const listStart = noticeTypeJava.indexOf('List.of(')
  const list = noticeTypeJava.slice(listStart, noticeTypeJava.indexOf(')', listStart))

  expect([...list.matchAll(/"([^"]+)"/g)].map((match) => match[1])).toEqual([...NOTICE_TYPES])
})

test('statuses match the status constraint', () => {
  expect(constraintValues('ck_place_status')).toEqual([...STATUSES])
})

test('error codes match the backend enum', () => {
  const javaNames = [...errorCodeJava.matchAll(/^\s*([A-Z_]+)\(HttpStatus\./gm)].map((match) => match[1])

  expect(javaNames).toEqual([...ERROR_CODES])
})

test('service centre is the Queenstown centre from the API specification', () => {
  expect(SERVICE_CENTER).toEqual({ latitude: -45.0312, longitude: 168.6626 })
  expect(SERVICE_RADIUS_KM).toBe(50)
})

test('the backend lists places from the same centre', () => {
  const placeServiceJava = readFileSync(
    new URL('java/com/queenstownlocal/backend/place/PlaceService.java', backend),
    'utf8',
  )

  expect(placeServiceJava).toContain(`CENTER_LATITUDE = ${SERVICE_CENTER.latitude};`)
  expect(placeServiceJava).toContain(`CENTER_LONGITUDE = ${SERVICE_CENTER.longitude};`)
})

test.each(CATEGORIES)('isCategory knows %s', (category) => {
  expect(isCategory(category)).toBe(true)
})

// "constructor" is there because a lookup in a plain object would find an inherited property.
test.each(['hotel', '', 'Food', 'constructor'])('isCategory refuses "%s"', (value) => {
  expect(isCategory(value)).toBe(false)
})

test.each(NOTICE_TYPES)('isNoticeType knows %s', (type) => {
  expect(isNoticeType(type)).toBe(true)
})

test.each(['fire', '', 'Road-Work', 'constructor'])('isNoticeType refuses "%s"', (value) => {
  expect(isNoticeType(value)).toBe(false)
})

test('event periods are the ones the backend accepts', () => {
  const eventServiceJava = readFileSync(
    new URL('java/com/queenstownlocal/backend/event/EventService.java', backend),
    'utf8',
  )
  const javaPeriods = [...eventServiceJava.matchAll(/case "([a-z]+)" ->/g)].map((match) => match[1])

  expect(javaPeriods).toEqual([...EVENT_PERIODS])
  expect(EVENT_PERIODS.every(isEventPeriod)).toBe(true)
  expect(isEventPeriod('year')).toBe(false)
})
