package com.queenstownlocal.backend.support;

import java.time.Clock;
import java.time.Instant;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;

/** Puts a {@link MutableClock} in place of the application's clock. Tests set it before each case. */
@TestConfiguration(proxyBeanMethods = false)
public class ClockConfiguration {

	/** Wednesday 14 October 2026, 10:00 in Queenstown (NZDT, UTC+13). */
	public static final Instant WEDNESDAY_MORNING = Instant.parse("2026-10-13T21:00:00Z");

	@Bean
	@Primary
	MutableClock mutableClock() {
		return new MutableClock(WEDNESDAY_MORNING);
	}

}
