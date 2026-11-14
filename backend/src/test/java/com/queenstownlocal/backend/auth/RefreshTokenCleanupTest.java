package com.queenstownlocal.backend.auth;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Duration;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.transaction.annotation.Transactional;

import com.queenstownlocal.backend.TestcontainersConfiguration;
import com.queenstownlocal.backend.support.ClockConfiguration;
import com.queenstownlocal.backend.support.MutableClock;

/** The daily removal of refresh tokens that can no longer be used. */
@SpringBootTest
@Import({ TestcontainersConfiguration.class, ClockConfiguration.class })
@Transactional
class RefreshTokenCleanupTest {

	@Autowired
	RefreshTokenCleanup cleanup;

	@Autowired
	JdbcClient jdbc;

	@Autowired
	MutableClock clock;

	private long userId;

	@BeforeEach
	void anAccount() {
		clock.set(ClockConfiguration.WEDNESDAY_MORNING);
		userId = jdbc.sql("insert into app_user (email, password_hash) values ('kiri@example.com', 'x') returning id")
			.query(Long.class)
			.single();
	}

	private void token(String hash, Duration expiresIn, Duration revokedAgo) {
		OffsetDateTime now = clock.instant().atOffset(ZoneOffset.UTC);
		jdbc.sql("insert into refresh_token (user_id, token_hash, expires_at, revoked_at) values (:user, :hash, :expires, :revoked)")
			.param("user", userId)
			.param("hash", hash)
			.param("expires", now.plus(expiresIn))
			.param("revoked", revokedAgo == null ? null : now.minus(revokedAgo))
			.update();
	}

	@Test
	void removesExpiredTokensAndThoseRevokedOverADayAgoAndKeepsTheRest() {
		token("expired", Duration.ofMinutes(-1), null);
		token("revoked-two-days-ago", Duration.ofDays(20), Duration.ofDays(2));
		token("revoked-an-hour-ago", Duration.ofDays(20), Duration.ofHours(1));
		token("good", Duration.ofDays(20), null);

		int removed = cleanup.run();

		assertThat(removed).isEqualTo(2);
		assertThat(jdbc.sql("select token_hash from refresh_token order by token_hash").query(String.class).list())
			.containsExactly("good", "revoked-an-hour-ago");
	}

	@Test
	void runsOnceADayAtNight() throws Exception {
		var scheduled = RefreshTokenCleanup.class.getMethod("run")
			.getAnnotation(org.springframework.scheduling.annotation.Scheduled.class);

		assertThat(scheduled).isNotNull();
		assertThat(scheduled.cron()).isEqualTo("0 30 3 * * *");
	}

}
