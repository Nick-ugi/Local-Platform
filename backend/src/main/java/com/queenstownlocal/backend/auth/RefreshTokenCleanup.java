package com.queenstownlocal.backend.auth;

import java.time.Clock;
import java.time.Duration;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Removes refresh tokens that can no longer be used. Every refresh revokes one token and adds
 * another, so without this the table would grow by a row each time a signed-in visitor comes back.
 * A revoked token is kept for a day, which is enough to look into a problem.
 */
@Component
public class RefreshTokenCleanup {

	private static final Logger log = LoggerFactory.getLogger(RefreshTokenCleanup.class);

	private static final Duration KEEP_REVOKED = Duration.ofDays(1);

	private final RefreshTokenMapper refreshTokens;

	private final Clock clock;

	public RefreshTokenCleanup(RefreshTokenMapper refreshTokens, Clock clock) {
		this.refreshTokens = refreshTokens;
		this.clock = clock;
	}

	/** Once a day, at night on the server's clock. Returns how many tokens went. */
	@Scheduled(cron = "0 30 3 * * *")
	@Transactional
	public int run() {
		OffsetDateTime now = this.clock.instant().atOffset(ZoneOffset.UTC);
		int removed = this.refreshTokens.deleteUnusable(now, now.minus(KEEP_REVOKED));
		log.info("Removed {} refresh tokens that had expired or been revoked", removed);
		return removed;
	}

}
