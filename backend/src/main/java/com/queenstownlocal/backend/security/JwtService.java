package com.queenstownlocal.backend.security;

import java.time.Clock;
import java.time.Instant;

import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;

/**
 * Issues access tokens: HS256 JWTs that name the account (sub), its email and its role, and last
 * app.jwt.access-token-ttl (15 minutes). SecurityConfiguration checks them on the way in.
 */
@Service
public class JwtService {

	static final String EMAIL = "email";

	static final String ROLE = "role";

	private final JwtEncoder encoder;

	private final JwtProperties properties;

	private final Clock clock;

	public JwtService(JwtEncoder encoder, JwtProperties properties, Clock clock) {
		this.encoder = encoder;
		this.properties = properties;
		this.clock = clock;
	}

	public String issue(AuthenticatedUser user) {
		Instant now = this.clock.instant();
		JwtClaimsSet claims = JwtClaimsSet.builder()
			.subject(Long.toString(user.id()))
			.claim(EMAIL, user.email())
			.claim(ROLE, user.role())
			.issuedAt(now)
			.expiresAt(now.plus(this.properties.accessTokenTtl()))
			.build();
		JwsHeader header = JwsHeader.with(MacAlgorithm.HS256).build();
		return this.encoder.encode(JwtEncoderParameters.from(header, claims)).getTokenValue();
	}

	/** How long a new access token lasts, in seconds: {@code expiresIn} of the token response. */
	public long accessTokenSeconds() {
		return this.properties.accessTokenTtl().toSeconds();
	}

}
