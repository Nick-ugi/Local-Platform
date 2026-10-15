// Event times and notice periods, always in New Zealand time (docs/04-wireframe.md: m-events,
// m-event, m-notices, m-notice). The API gives instants in UTC; what a visitor in Queenstown
// needs is the local day and hour, wherever the server or the visitor is.

const PARTS = new Intl.DateTimeFormat("en-NZ", {
  timeZone: "Pacific/Auckland",
  weekday: "short",
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

interface LocalTime {
  weekday: string;
  day: string;
  month: string;
  year: string;
  /** "5:00 pm" */
  time: string;
  /** "2026-Oct-9", for telling whether two times fall on the same day. */
  dayKey: string;
}

function local(iso: string): LocalTime {
  const parts: Record<string, string> = {};
  for (const part of PARTS.formatToParts(new Date(iso))) {
    parts[part.type] = part.value;
  }
  return {
    weekday: parts.weekday,
    day: parts.day,
    month: parts.month,
    year: parts.year,
    time: `${parts.hour}:${parts.minute} ${parts.dayPeriod.toLowerCase()}`,
    dayKey: `${parts.year}-${parts.month}-${parts.day}`,
  };
}

/**
 * The day an end belongs to. An end at midnight closes the day before, so an evening that runs
 * to 12:00 am is still one day.
 */
function endDay(iso: string): LocalTime {
  return local(new Date(new Date(iso).getTime() - 1).toISOString());
}

/** "23 Oct - 25 Oct", or with years "23 Oct - 25 Oct 2026" and "30 Dec 2026 - 2 Jan 2027". */
function dayRange(start: LocalTime, end: LocalTime, withYear: boolean): string {
  if (!withYear) {
    return `${start.day} ${start.month} - ${end.day} ${end.month}`;
  }
  if (start.year === end.year) {
    return `${start.day} ${start.month} - ${end.day} ${end.month} ${end.year}`;
  }
  return `${start.day} ${start.month} ${start.year} - ${end.day} ${end.month} ${end.year}`;
}

/**
 * When an event is on: "Fri 9 Oct · 5:00 pm - 9:00 pm" for one day, "Sat 17 Oct · 8:00 am"
 * without an end, "23 Oct - 25 Oct" over several days. A detail page passes `year` to add it.
 */
export function formatEventWhen(startsAt: string, endsAt: string | null, options: { year?: boolean } = {}): string {
  const withYear = options.year ?? false;
  const start = local(startsAt);
  const day = `${start.weekday} ${start.day} ${start.month}${withYear ? ` ${start.year}` : ""}`;

  if (endsAt === null) {
    return `${day} · ${start.time}`;
  }
  const lastDay = endDay(endsAt);
  if (lastDay.dayKey === start.dayKey) {
    return `${day} · ${start.time} - ${local(endsAt).time}`;
  }
  return dayRange(start, lastDay, withYear);
}

/**
 * How long a notice applies. A notice without an end has no range; the screen says it runs "From"
 * its start, a word that belongs in the messages, so that case comes back as the date alone.
 */
export type NoticePeriod = { kind: "range"; text: string } | { kind: "from"; date: string };

/**
 * "6 Oct - 20 Oct 2026" over several days, "17 Oct 2026 · 8:00 am - 6:00 pm" within one, and
 * { kind: "from", date: "12 Oct 2026" } without an end.
 */
export function noticePeriod(startsAt: string, endsAt: string | null): NoticePeriod {
  const start = local(startsAt);
  if (endsAt === null) {
    return { kind: "from", date: `${start.day} ${start.month} ${start.year}` };
  }
  const lastDay = endDay(endsAt);
  if (lastDay.dayKey === start.dayKey) {
    return {
      kind: "range",
      text: `${start.day} ${start.month} ${start.year} · ${start.time} - ${local(endsAt).time}`,
    };
  }
  return { kind: "range", text: dayRange(start, lastDay, true) };
}
