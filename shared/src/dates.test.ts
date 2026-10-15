import { expect, test } from 'vitest'
import { formatEventWhen, noticePeriod } from './dates'

// Times are written in New Zealand time (NZDT, UTC+13, in October) and shown in it, whatever the
// time zone of the machine running the tests.

test('an event on one day shows its day and its hours', () => {
  expect(formatEventWhen('2026-10-09T17:00:00+13:00', '2026-10-09T21:00:00+13:00')).toBe(
    'Fri 9 Oct · 5:00 pm - 9:00 pm',
  )
})

test('an event without an end shows when it starts', () => {
  expect(formatEventWhen('2026-10-17T08:00:00+13:00', null)).toBe('Sat 17 Oct · 8:00 am')
})

test('an event over several days shows the days', () => {
  expect(formatEventWhen('2026-10-23T10:00:00+13:00', '2026-10-25T16:00:00+13:00')).toBe('23 Oct - 25 Oct')
})

test('an event that ends at midnight is still one evening', () => {
  expect(formatEventWhen('2026-10-09T18:00:00+13:00', '2026-10-10T00:00:00+13:00')).toBe(
    'Fri 9 Oct · 6:00 pm - 12:00 am',
  )
})

test("the event's day is the New Zealand day, not the UTC day", () => {
  // 08:00 in Queenstown is 19:00 the day before in UTC.
  expect(formatEventWhen('2026-10-16T19:00:00Z', null)).toBe('Sat 17 Oct · 8:00 am')
})

test('a detail page adds the year', () => {
  expect(formatEventWhen('2026-10-09T17:00:00+13:00', '2026-10-09T21:00:00+13:00', { year: true })).toBe(
    'Fri 9 Oct 2026 · 5:00 pm - 9:00 pm',
  )
  expect(formatEventWhen('2026-10-23T10:00:00+13:00', '2026-10-25T16:00:00+13:00', { year: true })).toBe(
    '23 Oct - 25 Oct 2026',
  )
  expect(formatEventWhen('2026-12-30T10:00:00+13:00', '2027-01-02T16:00:00+13:00', { year: true })).toBe(
    '30 Dec 2026 - 2 Jan 2027',
  )
})

test('minutes past the hour are kept', () => {
  expect(formatEventWhen('2026-10-09T17:30:00+13:00', null)).toBe('Fri 9 Oct · 5:30 pm')
})

test('a notice over several days shows the days and the year', () => {
  expect(noticePeriod('2026-10-06T07:00:00+13:00', '2026-10-20T18:00:00+13:00')).toEqual({
    kind: 'range',
    text: '6 Oct - 20 Oct 2026',
  })
})

test('a notice across the new year shows both years', () => {
  expect(noticePeriod('2026-12-28T07:00:00+13:00', '2027-01-04T18:00:00+13:00')).toEqual({
    kind: 'range',
    text: '28 Dec 2026 - 4 Jan 2027',
  })
})

test('a notice on one day shows its hours', () => {
  expect(noticePeriod('2026-10-17T08:00:00+13:00', '2026-10-17T18:00:00+13:00')).toEqual({
    kind: 'range',
    text: '17 Oct 2026 · 8:00 am - 6:00 pm',
  })
})

test('a notice without an end runs from its start', () => {
  expect(noticePeriod('2026-10-12T09:00:00+13:00', null)).toEqual({ kind: 'from', date: '12 Oct 2026' })
})

test('winter dates use New Zealand standard time', () => {
  // NZST is UTC+12: 23:30 UTC on 30 June is 11:30 am on 1 July.
  expect(formatEventWhen('2026-06-30T23:30:00Z', null)).toBe('Wed 1 Jul · 11:30 am')
})
