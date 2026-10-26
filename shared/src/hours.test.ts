import { describe, expect, test } from 'vitest'
import { formatWeeklyHours, openStatus, parseOpeningHours, type WeeklyHours } from './hours'

/** Monday 0 … Sunday 6, each a list of [start, end) in minutes. */
function days(hours: WeeklyHours | null) {
  if (!hours || hours.kind !== 'weekly') throw new Error(`not weekly: ${JSON.stringify(hours)}`)
  return hours.days
}

const h = (hour: number, minute = 0) => hour * 60 + minute

describe('parseOpeningHours', () => {
  test('every day the same', () => {
    const week = days(parseOpeningHours('Mo-Su 10:00-20:30'))
    expect(week).toHaveLength(7)
    for (const day of week) expect(day).toEqual([[h(10), h(20, 30)]])
  })

  test('two rules for weekdays and the weekend', () => {
    const week = days(parseOpeningHours('Mo-Fr 08:00-17:00; Sa-Su 09:00-15:00'))
    expect(week[0]).toEqual([[h(8), h(17)]])
    expect(week[5]).toEqual([[h(9), h(15)]])
  })

  test('a later rule replaces an earlier one for its days', () => {
    const week = days(parseOpeningHours('Mo-Su 10:00-20:00; Su off'))
    expect(week[5]).toEqual([[h(10), h(20)]])
    expect(week[6]).toEqual([])
  })

  test('an evening to midnight ends at midnight', () => {
    expect(days(parseOpeningHours('Fr,Sa 16:00-00:00'))[4]).toEqual([[h(16), h(24)]])
  })

  test('an evening past midnight runs into the next day', () => {
    expect(days(parseOpeningHours('Mo-Th 17:00-02:00'))[3]).toEqual([[h(17), h(26)]])
  })

  test('a day range can wrap round the week', () => {
    const week = days(parseOpeningHours('We-Mo 09:00-17:00'))
    expect(week[1]).toEqual([])
    expect(week[6]).toEqual([[h(9), h(17)]])
    expect(week[0]).toEqual([[h(9), h(17)]])
  })

  test('several times in one rule, and no days for every day', () => {
    for (const day of days(parseOpeningHours('11:00-14:00,17:00-21:00'))) {
      expect(day).toEqual([
        [h(11), h(14)],
        [h(17), h(21)],
      ])
    }
  })

  test('a comma before days starts a new rule', () => {
    const week = days(parseOpeningHours('Mo-Fr 08:00-17:00, Sa 09:00-12:00'))
    expect(week[4]).toEqual([[h(8), h(17)]])
    expect(week[5]).toEqual([[h(9), h(12)]])
    expect(week[6]).toEqual([])
  })

  test('lists with gaps and spaces', () => {
    const week = days(parseOpeningHours('Mo, We 10:00-15:00; Tu 12:00-15:00; Th-Su 10:00-16:00'))
    expect(week[0]).toEqual([[h(10), h(15)]])
    expect(week[1]).toEqual([[h(12), h(15)]])
    expect(week[2]).toEqual([[h(10), h(15)]])
  })

  test('public holidays are left out, and a rule only for them is skipped', () => {
    expect(days(parseOpeningHours('PH,Mo-Su 09:00-17:00'))[2]).toEqual([[h(9), h(17)]])
    expect(days(parseOpeningHours('Mo-Fr 09:00-17:00; PH off'))[0]).toEqual([[h(9), h(17)]])
  })

  test('24/7 is always open', () => {
    expect(parseOpeningHours('24/7')).toEqual({ kind: 'always' })
  })

  test.each([
    'Jun-Oct: Mo-Su 10:00-16:00',
    'Tu-Su 17:00+',
    'Mon - Sun · 8:00 am - 10:00 pm',
    'Mo-Fr sunrise-sunset',
    'Mo-Fr 25:00-26:00',
    '',
    '   ',
  ])('does not guess at %j', (text) => {
    expect(parseOpeningHours(text)).toBeNull()
  })

  test('nothing to read', () => {
    expect(parseOpeningHours(null)).toBeNull()
  })
})

describe('formatWeeklyHours', () => {
  test('one line for a whole week', () => {
    expect(formatWeeklyHours(parseOpeningHours('Mo-Su 10:00-20:30')!)).toEqual(['Mon - Sun · 10:00 am - 8:30 pm'])
  })

  test('consecutive days with the same hours share a line; days without hours are closed', () => {
    expect(formatWeeklyHours(parseOpeningHours('Mo-Fr 08:00-17:00; Sa off')!)).toEqual([
      'Mon - Fri · 8:00 am - 5:00 pm',
      'Sat - Sun · Closed',
    ])
  })

  test('a single day, two times, midnight and noon', () => {
    expect(formatWeeklyHours(parseOpeningHours('Mo-Sa 12:00-14:00,17:00-00:00; Su 09:00-12:00')!)).toEqual([
      'Mon - Sat · 12:00 pm - 2:00 pm, 5:00 pm - 12:00 am',
      'Sun · 9:00 am - 12:00 pm',
    ])
  })

  test('an evening past midnight shows its closing time', () => {
    expect(formatWeeklyHours(parseOpeningHours('Mo-Su 17:00-02:00')!)).toEqual(['Mon - Sun · 5:00 pm - 2:00 am'])
  })

  test('always open', () => {
    expect(formatWeeklyHours({ kind: 'always' })).toEqual(['Open 24 hours'])
  })
})

describe('openStatus', () => {
  // Tuesday 20 October 2026 is daylight saving time in New Zealand (UTC+13).
  const nz = (iso: string) => new Date(iso)

  test('open, closing within half an hour', () => {
    expect(openStatus(parseOpeningHours('Mo-Su 09:00-17:00')!, nz('2026-10-20T16:45:00+13:00'))).toEqual({
      state: 'open',
      closesAt: '5:00 pm',
      soon: true,
    })
  })

  test('the same instant written in UTC gives the same answer', () => {
    expect(openStatus(parseOpeningHours('Mo-Su 09:00-17:00')!, nz('2026-10-20T03:45:00Z'))).toEqual({
      state: 'open',
      closesAt: '5:00 pm',
      soon: true,
    })
  })

  test('open with time to spare', () => {
    expect(openStatus(parseOpeningHours('Mo-Su 09:00-17:00')!, nz('2026-10-20T10:00:00+13:00'))).toEqual({
      state: 'open',
      closesAt: '5:00 pm',
      soon: false,
    })
  })

  test('closed until later today', () => {
    expect(openStatus(parseOpeningHours('Mo-Su 09:00-17:00')!, nz('2026-10-20T07:30:00+13:00'))).toEqual({
      state: 'closed',
      opensAt: { day: null, time: '9:00 am' },
    })
  })

  test('closed on Sunday evening until Monday morning', () => {
    // Sunday 25 October 2026, 20:00.
    expect(openStatus(parseOpeningHours('Mo-Fr 09:00-17:00')!, nz('2026-10-25T20:00:00+13:00'))).toEqual({
      state: 'closed',
      opensAt: { day: 'Mon', time: '9:00 am' },
    })
  })

  test("still open after midnight from the evening before", () => {
    // Friday 23 October 2026, 01:00, after Thursday's 17:00-02:00.
    expect(openStatus(parseOpeningHours('Mo-Th 17:00-02:00')!, nz('2026-10-23T01:00:00+13:00'))).toEqual({
      state: 'open',
      closesAt: '2:00 am',
      soon: false,
    })
  })

  test('closed at one on Saturday morning when Friday ended at midnight', () => {
    expect(openStatus(parseOpeningHours('Fr,Sa 16:00-00:00')!, nz('2026-10-24T01:00:00+13:00'))).toEqual({
      state: 'closed',
      opensAt: { day: null, time: '4:00 pm' },
    })
  })

  test('always open, and never open', () => {
    expect(openStatus({ kind: 'always' }, nz('2026-10-20T03:00:00+13:00'))).toEqual({
      state: 'open',
      closesAt: null,
      soon: false,
    })
    expect(openStatus(parseOpeningHours('Mo off')!, nz('2026-10-20T03:00:00+13:00'))).toEqual({
      state: 'closed',
      opensAt: null,
    })
  })
})
