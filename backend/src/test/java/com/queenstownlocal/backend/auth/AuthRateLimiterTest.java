package com.queenstownlocal.backend.auth;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.Duration;
import java.time.Instant;

import org.junit.jupiter.api.Test;

import com.queenstownlocal.backend.common.error.TooManyRequestsException;
import com.queenstownlocal.backend.support.MutableClock;

/**
 * The limiter's memory stays bounded: requests with a new email each time (a new count each) cannot
 * grow it without end on a small server.
 */
class AuthRateLimiterTest {

	private static final Instant START = Instant.parse("2026-10-13T21:00:00Z");

	private final MutableClock clock = new MutableClock(START);

	@Test
	void refusesNewCountsWhenItRemembersTooMany() {
		AuthRateLimiter limiter = new AuthRateLimiter(this.clock, 3);
		limiter.acquire("198.51.100.1", "a@example.com");
		limiter.acquire("198.51.100.1", "b@example.com");
		limiter.acquire("198.51.100.1", "c@example.com");

		assertThatThrownBy(() -> limiter.acquire("198.51.100.1", "d@example.com"))
			.isInstanceOf(TooManyRequestsException.class);
		assertThatCode(() -> limiter.acquire("198.51.100.1", "a@example.com")).doesNotThrowAnyException();
	}

	@Test
	void forgetsFinishedWindowsToMakeRoom() {
		AuthRateLimiter limiter = new AuthRateLimiter(this.clock, 3);
		limiter.acquire("198.51.100.1", "a@example.com");
		limiter.acquire("198.51.100.1", "b@example.com");
		limiter.acquire("198.51.100.1", "c@example.com");

		this.clock.set(START.plus(Duration.ofMinutes(10)));

		assertThatCode(() -> limiter.acquire("198.51.100.1", "d@example.com")).doesNotThrowAnyException();
	}

}
