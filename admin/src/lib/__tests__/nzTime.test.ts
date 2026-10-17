import { expect, test } from "vitest";
import { formatNzDate, fromNzInput, toNzInput } from "../nzTime";

test("an instant shows as Queenstown's wall time", () => {
  expect(toNzInput("2026-10-16T04:00:00Z")).toBe("2026-10-16T17:00");
  expect(toNzInput("2026-06-30T23:30:00Z")).toBe("2026-07-01T11:30");
  expect(toNzInput(null)).toBe("");
});

test("Queenstown's wall time is sent with its offset, summer and winter", () => {
  expect(fromNzInput("2026-10-16T17:00")).toBe("2026-10-16T17:00:00+13:00");
  expect(fromNzInput("2026-07-01T11:30")).toBe("2026-07-01T11:30:00+12:00");
});

test("both ways give the same instant", () => {
  for (const iso of ["2026-12-31T10:59:00Z", "2026-04-04T10:00:00Z", "2026-09-26T14:00:00Z"]) {
    expect(Date.parse(fromNzInput(toNzInput(iso)) as string)).toBe(Date.parse(iso));
  }
});

test("an empty or broken value is no time", () => {
  expect(fromNzInput("")).toBeNull();
  expect(fromNzInput("16/10/2026 5pm")).toBeNull();
});

test("list dates are New Zealand days", () => {
  expect(formatNzDate("2026-10-01T12:30:00Z")).toBe("2 Oct 2026");
});

test("a time summer time skips comes out as the clock shows it", () => {
  // Clocks went from 2:00 to 3:00 on Sunday 27 September 2026.
  expect(fromNzInput("2026-09-27T02:30")).toBe("2026-09-27T03:30:00+13:00");
});
