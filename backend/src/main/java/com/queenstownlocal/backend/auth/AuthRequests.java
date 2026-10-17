package com.queenstownlocal.backend.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Request bodies of /auth (docs/06-api-specification.md, section 8). */
public final class AuthRequests {

	private AuthRequests() {
	}

	/**
	 * POST /auth/signup. BCrypt reads at most 72 bytes of a password, so a longer one is refused
	 * rather than cut without a word.
	 */
	public record Signup(@NotBlank @Email @Size(max = 255) String email,
			@NotBlank @Size(min = 8, max = 72) String password) {
	}

	/** POST /auth/login. */
	public record Login(@NotBlank String email, @NotBlank String password) {
	}

	/** POST /auth/refresh and POST /auth/logout. */
	public record Refresh(@NotBlank String refreshToken) {
	}

}
