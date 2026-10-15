// The admin types dates and times as they are in Queenstown, whatever the time zone of the computer
// it runs on. <input type="datetime-local"> holds "2026-10-16T17:00" with no zone; these turn that
// into an instant with New Zealand's offset and back.

const ZONE = "Pacific/Auckland";

const PARTS = new Intl.DateTimeFormat("en-NZ", {
  timeZone: ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

function nzParts(instant: number): Record<string, number> {
  const parts: Record<string, number> = {};
  for (const part of PARTS.formatToParts(new Date(instant))) {
    if (part.type !== "literal") {
      parts[part.type] = Number(part.value);
    }
  }
  return parts;
}

/** Minutes New Zealand is ahead of UTC at an instant: 780 in summer (NZDT), 720 in winter (NZST). */
function offsetMinutes(instant: number): number {
  const p = nzParts(instant);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute);
  return Math.round((asUtc - Math.floor(instant / 60000) * 60000) / 60000);
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** "2026-10-16T04:00:00Z" → "2026-10-16T17:00", for an input. Empty for null. */
export function toNzInput(iso: string | null): string {
  if (!iso) {
    return "";
  }
  const p = nzParts(Date.parse(iso));
  return `${p.year}-${pad(p.month)}-${pad(p.day)}T${pad(p.hour)}:${pad(p.minute)}`;
}

/**
 * "2026-10-16T17:00" in Queenstown → "2026-10-16T17:00:00+13:00", for the API. Null for an empty
 * or unreadable value. A time the change to summer time skips comes out an hour later, as a clock
 * shows it; one that the change back repeats is taken once.
 */
export function fromNzInput(value: string): string | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!match) {
    return null;
  }
  const [year, month, day, hour, minute] = match.slice(1).map(Number);
  const wall = Date.UTC(year, month - 1, day, hour, minute);
  // The offset depends on the instant, which depends on the offset: two rounds settle it.
  let offset = offsetMinutes(wall - 12 * 3600000);
  offset = offsetMinutes(wall - offset * 60000);
  // The wall time and offset read back at that instant: the same, except in the hour summer time skips.
  const instant = wall - offset * 60000;
  const p = nzParts(instant);
  const actual = offsetMinutes(instant);
  const sign = actual >= 0 ? "+" : "-";
  const text = `${p.year}-${pad(p.month)}-${pad(p.day)}T${pad(p.hour)}:${pad(p.minute)}:00`;
  return `${text}${sign}${pad(Math.floor(Math.abs(actual) / 60))}:${pad(Math.abs(actual) % 60)}`;
}

/** "2 Oct 2026" in New Zealand, for the lists. */
export function formatNzDate(iso: string): string {
  return new Intl.DateTimeFormat("en-NZ", { timeZone: ZONE, day: "numeric", month: "short", year: "numeric" }).format(
    new Date(iso),
  );
}
