package com.queenstownlocal.backend.support;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZoneOffset;

/** A clock that stays where a test puts it. */
public class MutableClock extends Clock {

	private volatile Instant instant;

	public MutableClock(Instant instant) {
		this.instant = instant;
	}

	public void set(Instant instant) {
		this.instant = instant;
	}

	@Override
	public Instant instant() {
		return this.instant;
	}

	@Override
	public ZoneId getZone() {
		return ZoneOffset.UTC;
	}

	@Override
	public Clock withZone(ZoneId zone) {
		throw new UnsupportedOperationException("The application reads instants only.");
	}

}
