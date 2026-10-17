package com.queenstownlocal.backend.security;

import java.nio.charset.StandardCharsets;
import java.time.Duration;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * How tokens are made (app.jwt in application.yml): the key that signs access tokens and how long
 * each kind of token lasts.
 */
@ConfigurationProperties("app.jwt")
public record JwtProperties(String secret, Duration accessTokenTtl, Duration refreshTokenTtl) {

	/** The value application.yml falls back to. A server that runs with it says so in its log. */
	static final String DEVELOPMENT_SECRET = "development-only-secret-change-me-0123456789";

	public JwtProperties {
		if (secret == null || secret.getBytes(StandardCharsets.UTF_8).length < 32) {
			throw new IllegalArgumentException("app.jwt.secret (JWT_SECRET) must be at least 32 bytes");
		}
	}

}
