package com.queenstownlocal.backend.common.time;

import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.TemporalAdjusters;

/**
 * Days as Queenstown has them. Dates on screen and the date filters follow New Zealand time
 * wherever the server runs, and a day there is 23 or 25 hours long when daylight saving starts or
 * ends.
 */
public final class NzDates {

	public static final ZoneId ZONE = ZoneId.of("Pacific/Auckland");

	private NzDates() {
	}

	/** A span of time from {@code from} (included) to {@code to} (excluded). */
	public record Window(Instant from, Instant to) {
	}

	/** The New Zealand day that {@code now} falls on. */
	public static Window today(Instant now) {
		LocalDate day = LocalDate.ofInstant(now, ZONE);
		return between(day, day.plusDays(1));
	}

	/** Monday to Sunday of the New Zealand week that {@code now} falls in. */
	public static Window week(Instant now) {
		LocalDate monday = LocalDate.ofInstant(now, ZONE).with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
		return between(monday, monday.plusWeeks(1));
	}

	/** The first to the last day of the New Zealand month that {@code now} falls in. */
	public static Window month(Instant now) {
		LocalDate first = LocalDate.ofInstant(now, ZONE).withDayOfMonth(1);
		return between(first, first.plusMonths(1));
	}

	private static Window between(LocalDate first, LocalDate afterLast) {
		return new Window(first.atStartOfDay(ZONE).toInstant(), afterLast.atStartOfDay(ZONE).toInstant());
	}

}
