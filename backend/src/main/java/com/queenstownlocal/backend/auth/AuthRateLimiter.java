package com.queenstownlocal.backend.auth;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import com.queenstownlocal.backend.common.error.TooManyRequestsException;

/**
 * Limits log in and sign up to {@value #MAX_ATTEMPTS} tries per client address in each
 * {@link #WINDOW} (docs/06-api-specification.md, section 1, TOO_MANY_REQUESTS), which slows down
 * password guessing without bothering a person who mistypes. The window starts at an address's first
 * try. Behind a proxy the address is the visitor's, as the proxy forwarded it (application-prod.yml).
 *
 * The counts live in this server's memory: one server is enough for the MVP. With several servers
 * they would have to move to a store the servers share.
 */
@Component
public class AuthRateLimiter {

	static final int MAX_ATTEMPTS = 20;

	static final Duration WINDOW = Duration.ofMinutes(10);

	/** Above this many addresses, the windows that are over are dropped. */
	private static final int TIDY_ABOVE = 10_000;

	private static final Logger log = LoggerFactory.getLogger(AuthRateLimiter.class);

	private final Clock clock;

	private final ConcurrentMap<String, Window> windows = new ConcurrentHashMap<>();

	public AuthRateLimiter(Clock clock) {
		this.clock = clock;
	}

	/** Counts one try from the address, or refuses it with the time left in its window. */
	public void acquire(String clientAddress) {
		Instant now = this.clock.instant();
		if (this.windows.size() > TIDY_ABOVE) {
			this.windows.values().removeIf(window -> window.isOver(now));
		}
		Window window = this.windows.compute(clientAddress,
				(address, current) -> current == null || current.isOver(now) ? new Window(now, 1) : current.next());
		if (window.attempts() > MAX_ATTEMPTS) {
			log.info("Too many log in or sign up attempts from {}", clientAddress);
			throw new TooManyRequestsException(Duration.between(now, window.start().plus(WINDOW)));
		}
	}

	private record Window(Instant start, int attempts) {

		boolean isOver(Instant now) {
			return !now.isBefore(this.start.plus(WINDOW));
		}

		Window next() {
			return new Window(this.start, this.attempts + 1);
		}

	}

}
