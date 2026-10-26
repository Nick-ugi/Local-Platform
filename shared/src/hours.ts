// Opening hours as OpenStreetMap writes them (the first data, backend/seed/osm), read into a week
// so the apps can show them plainly and say whether a place is open now (PLACE-07). Only the common
// forms are read; anything else (months, "17:00+", sunrise) is left to be shown as written, because
// a wrong "Open now" is worse than none. Times are New Zealand time, wherever the device is.

/** [start, end) in minutes from the start of the day. An end past 1440 runs into the next day. */
export type Interval = [start: number, end: number]

export type WeeklyHours =
  | { kind: 'always' }
  /** Monday first: days[0] is Monday, days[6] Sunday. A day without intervals is closed. */
  | { kind: 'weekly'; days: Interval[][] }

export type OpenStatus =
  | { state: 'open'; closesAt: string | null; soon: boolean }
  /** opensAt.day is null for later today, otherwise 'Mon' … 'Sun'; opensAt is null for never. */
  | { state: 'closed'; opensAt: { day: string | null; time: string } | null }

const OSM_DAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']
const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const DAY_MINUTES = 24 * 60
/** Closing within this many minutes counts as soon. */
const SOON_MINUTES = 30

const DAY = '(?:Mo|Tu|We|Th|Fr|Sa|Su|PH)'
const SELECTOR = new RegExp(`^(${DAY}(?:\\s*[-,]\\s*${DAY})*)\\s+(.+)$`)
// A comma after a time and before a day starts a new rule: "Mo-Fr 08:00-17:00, Sa 09:00-12:00".
const RULE_COMMA = new RegExp(`(?<=\\d)\\s*,\\s*(?=${DAY}\\b)`)
const TIME_RANGE = /^(\d{1,2}):(\d{2})-(\d{1,2}):(\d{2})$/

/** The days a selector such as "Mo,We-Su" or "PH,Mo-Fr" names, or null when it cannot be read. */
function selectDays(selector: string): number[] | null {
  const selected: number[] = []
  for (const token of selector.split(',').map((part) => part.trim())) {
    if (token === 'PH') {
      continue
    }
    const [from, to] = token.split('-').map((part) => part.trim())
    const first = OSM_DAYS.indexOf(from)
    const last = to === undefined ? first : OSM_DAYS.indexOf(to)
    if (first < 0 || last < 0) {
      return null
    }
    for (let day = first; ; day = (day + 1) % 7) {
      selected.push(day)
      if (day === last) break
    }
  }
  return selected
}

/** "11:00-14:00,17:00-21:00" or "off" as intervals, or null when it cannot be read. */
function readTimes(text: string): Interval[] | null {
  if (text === 'off' || text === 'closed') {
    return []
  }
  const intervals: Interval[] = []
  for (const part of text.split(',').map((piece) => piece.trim())) {
    const match = TIME_RANGE.exec(part)
    if (!match) {
      return null
    }
    const [startHour, startMinute, endHour, endMinute] = match.slice(1).map(Number)
    if (startHour > 23 || endHour > 24 || startMinute > 59 || endMinute > 59) {
      return null
    }
    const start = startHour * 60 + startMinute
    let end = endHour * 60 + endMinute
    if (end <= start) {
      end += DAY_MINUTES
    }
    intervals.push([start, end])
  }
  return intervals.sort((a, b) => a[0] - b[0])
}

/** The week of an OpenStreetMap opening_hours value, or null when it is not one of the read forms. */
export function parseOpeningHours(text: string | null): WeeklyHours | null {
  const value = text?.trim()
  if (!value) {
    return null
  }
  if (value === '24/7') {
    return { kind: 'always' }
  }
  const days: (Interval[] | null)[] = Array.from({ length: 7 }, () => null)
  const rules = value
    .split(';')
    .flatMap((rule) => rule.split(RULE_COMMA))
    .map((rule) => rule.trim())
    .filter(Boolean)
  for (const rule of rules) {
    let selected: number[] | null = [0, 1, 2, 3, 4, 5, 6]
    let times = rule
    if (!/^\d/.test(rule)) {
      const match = SELECTOR.exec(rule)
      if (!match) {
        return null
      }
      selected = selectDays(match[1])
      times = match[2].trim()
    }
    const intervals = readTimes(times)
    if (!selected || !intervals) {
      return null
    }
    // A later rule replaces what an earlier one said about its days.
    for (const day of selected) {
      days[day] = intervals
    }
  }
  return { kind: 'weekly', days: days.map((day) => day ?? []) }
}

/** '5:00 pm', '12:00 am' for midnight, '2:00 am' for an end that runs into the next day. */
function clock(minutes: number): string {
  const inDay = minutes % DAY_MINUTES
  const hour = Math.floor(inDay / 60)
  const minute = String(inDay % 60).padStart(2, '0')
  return `${hour % 12 === 0 ? 12 : hour % 12}:${minute} ${hour < 12 ? 'am' : 'pm'}`
}

function describeDay(intervals: Interval[]): string {
  return intervals.length === 0
    ? 'Closed'
    : intervals.map(([start, end]) => `${clock(start)} - ${clock(end)}`).join(', ')
}

/** One line per run of consecutive days with the same hours: 'Mon - Fri · 8:00 am - 5:00 pm'. */
export function formatWeeklyHours(hours: WeeklyHours): string[] {
  if (hours.kind === 'always') {
    return ['Open 24 hours']
  }
  const lines: string[] = []
  let first = 0
  for (let day = 1; day <= 7; day++) {
    const text = describeDay(hours.days[first])
    if (day === 7 || describeDay(hours.days[day]) !== text) {
      const name = first === day - 1 ? DAY_NAMES[first] : `${DAY_NAMES[first]} - ${DAY_NAMES[day - 1]}`
      lines.push(`${name} · ${text}`)
      first = day
    }
  }
  return lines
}

const NZ_NOW = new Intl.DateTimeFormat('en-US', {
  timeZone: 'Pacific/Auckland',
  weekday: 'short',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

/** Monday 0 … Sunday 6 and minutes from midnight, in New Zealand. */
function nzWeekMinute(now: Date): { day: number; minute: number } {
  const parts: Record<string, string> = {}
  for (const part of NZ_NOW.formatToParts(now)) {
    parts[part.type] = part.value
  }
  return {
    day: DAY_NAMES.indexOf(parts.weekday),
    minute: Number(parts.hour) * 60 + Number(parts.minute),
  }
}

/** Whether the place is open at `now` in New Zealand, and when that changes. */
export function openStatus(hours: WeeklyHours, now: Date): OpenStatus {
  if (hours.kind === 'always') {
    return { state: 'open', closesAt: null, soon: false }
  }
  const { day, minute } = nzWeekMinute(now)
  const open = (end: number, at: number): OpenStatus => ({
    state: 'open',
    closesAt: clock(end),
    soon: end - at <= SOON_MINUTES,
  })
  for (const [start, end] of hours.days[day]) {
    if (start <= minute && minute < end) {
      return open(end, minute)
    }
  }
  // Yesterday's evening that runs past midnight.
  const atYesterday = minute + DAY_MINUTES
  for (const [start, end] of hours.days[(day + 6) % 7]) {
    if (start <= atYesterday && atYesterday < end) {
      return open(end, atYesterday)
    }
  }
  const later = hours.days[day].find(([start]) => start > minute)
  if (later) {
    return { state: 'closed', opensAt: { day: null, time: clock(later[0]) } }
  }
  for (let ahead = 1; ahead <= 7; ahead++) {
    const next = (day + ahead) % 7
    const first = hours.days[next][0]
    if (first) {
      return { state: 'closed', opensAt: { day: DAY_NAMES[next], time: clock(first[0]) } }
    }
  }
  return { state: 'closed', opensAt: null }
}
