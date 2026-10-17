package com.queenstownlocal.backend.security;

import org.springframework.security.core.Authentication;

import com.queenstownlocal.backend.common.error.ApiException;
import com.queenstownlocal.backend.common.error.ErrorCode;

/** The account a request was made with, as its access token names it. */
public record AuthenticatedUser(long id, String email, String role) {

	/** The account of a request that SecurityConfiguration let through as signed in. */
	public static AuthenticatedUser of(Authentication authentication) {
		if (authentication != null && authentication.getDetails() instanceof AuthenticatedUser user) {
			return user;
		}
		throw new ApiException(ErrorCode.UNAUTHORIZED, "Sign in to continue.");
	}

}
