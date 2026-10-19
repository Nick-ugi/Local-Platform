package com.queenstownlocal.backend.security;

import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

/**
 * In production (profile prod) the server does not start with the development JWT key: anyone who
 * read application.yml could sign their own admin tokens with it.
 */
@Component
@Profile("prod")
class ProductionSecretCheck {

	ProductionSecretCheck(JwtProperties properties) {
		if (JwtProperties.DEVELOPMENT_SECRET.equals(properties.secret())) {
			throw new IllegalStateException("JWT_SECRET must be set in production");
		}
	}

}
