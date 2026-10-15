package com.queenstownlocal.backend.auth;

/** What signup, login and refresh answer (docs/06-api-specification.md, section 8). */
public record TokenResponse(String accessToken, String refreshToken, long expiresIn, User user) {

	/** The account the tokens are for. Also the body of GET /me. */
	public record User(String email, String role) {
	}

}
