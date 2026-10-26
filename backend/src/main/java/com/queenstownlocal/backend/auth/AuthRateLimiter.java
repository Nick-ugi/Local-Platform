package com.queenstownlocal.backend.auth;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Locale;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import com.queenstownlocal.backend.common.error.TooManyRequestsException;

/**
 * Limits log in and sign up to {@value #MAX_ATTEMPTS} tries in each {@link #WINDOW}
 * (docs/06-api-specification.md, section 1, TOO_MANY_REQUESTS), which slows down password guessing
 * without bothering a person who mistypes. Log in is counted per client address and account, sign up
 * per address. The window starts at the first try. Behind a proxy the address is the visitor's, as the
 * proxy forwarded it (application-prod.yml).
 *
 * Log in counts the account too because several visitors can arrive from one address: the web
 * server calls for all of its visitors, and on a host whose own address is not a trusted proxy
 * (Render's free plan) the backend cannot see past it. Someone guessing one account's password then
 * cannot lock everyone else out.
 *
 * The counts live in this server's memory: one server is enough for the MVP. With several servers
 * they would have to move to a store the servers share.
 */
@Component
public class AuthRateLimiter {

	static final int MAX_ATTEMPTS = 20;

	static final Duration WINDOW = Duration.ofMinutes(10);

	/**
	 * The most counts kept at once. Log in keeps one per address and email, so requests that make up a
	 * new email each time would otherwise grow the memory without end. A new count beyond this is
	 * refused until windows that are over make room.
	 */
	static final int MAX_COUNTS = 100_000;

	/** How often, at most, the windows that are over are dropped. Dropping them reads every count. */
	private static final Duration TIDY_EVERY = Duration.ofMinutes(1);

	private static final Logger log = LoggerFactory.getLogger(AuthRateLimiter.class);

	private final Clock clock;

	private final ConcurrentMap<String, Window> windows = new ConcurrentHashMap<>();

	private final int maxCounts;

	private volatile Instant nextTidy = Instant.MIN;

	@Autowired
	public AuthRateLimiter(Clock clock) {
		this(clock, MAX_COUNTS);
	}

	AuthRateLimiter(Clock clock, int maxCounts) {
		this.clock = clock;
		this.maxCounts = maxCounts;
	}

	/**
	 * Counts one try from the address for the account (null for sign up), or refuses it with the time
	 * left in its window.
	 */
	public void acquire(String clientAddress, String account) {
		Instant now = this.clock.instant();
		if (this.windows.size() >= this.maxCounts / 2 && !now.isBefore(this.nextTidy)) {
			this.nextTidy = now.plus(TIDY_EVERY);
			this.windows.values().removeIf(window -> window.isOver(now));
		}
		String key = account == null ? clientAddress : clientAddress + " " + account.trim().toLowerCase(Locale.ROOT);
		if (this.windows.size() >= this.maxCounts && !this.windows.containsKey(key)) {
			log.warn("Log in and sign up limit is full ({} counts); refusing new ones for now", this.maxCounts);
			throw new TooManyRequestsException(TIDY_EVERY);
		}
		Window window = this.windows.compute(key,
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
