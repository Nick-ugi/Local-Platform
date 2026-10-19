package com.queenstownlocal.backend.security;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Duration;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;

/** The production profile refuses to start with the development JWT key (README, "JWT_SECRET"). */
class ProductionSecretCheckTest {

	private static final String STRONG = "a-production-like-secret-of-more-than-32-bytes-0123";

	private static ApplicationContextRunner runner(String secret, String... profiles) {
		return new ApplicationContextRunner()
			.withInitializer(context -> context.getEnvironment().setActiveProfiles(profiles))
			.withBean(JwtProperties.class, () -> new JwtProperties(secret, Duration.ofMinutes(15), Duration.ofDays(30)))
			.withUserConfiguration(ProductionSecretCheck.class);
	}

	@Test
	void productionWithTheDevelopmentKeyDoesNotStart() {
		runner(JwtProperties.DEVELOPMENT_SECRET, "prod").run(context -> {
			assertThat(context).hasFailed();
			assertThat(context.getStartupFailure()).rootCause().hasMessageContaining("JWT_SECRET");
		});
	}

	@Test
	void productionWithItsOwnKeyStarts() {
		runner(STRONG, "prod").run(context -> assertThat(context).hasNotFailed().hasSingleBean(ProductionSecretCheck.class));
	}

	@Test
	void developmentMayUseTheDevelopmentKey() {
		runner(JwtProperties.DEVELOPMENT_SECRET).run(context -> assertThat(context).hasNotFailed()
			.doesNotHaveBean(ProductionSecretCheck.class));
	}

}
