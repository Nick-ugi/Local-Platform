package com.queenstownlocal.backend.common.error;

import java.time.Duration;

/** Too many tries for now. The response says when to try again in {@code Retry-After}. */
public class TooManyRequestsException extends ApiException {

	private final Duration retryAfter;

	public TooManyRequestsException(Duration retryAfter) {
		super(ErrorCode.TOO_MANY_REQUESTS, "Too many attempts. Try again later.");
		this.retryAfter = retryAfter;
	}

	public Duration retryAfter() {
		return this.retryAfter;
	}

}
