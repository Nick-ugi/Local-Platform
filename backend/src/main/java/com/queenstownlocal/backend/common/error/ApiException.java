package com.queenstownlocal.backend.common.error;

/** An error the API reports to the client with a code and a detail message that is safe to show. */
public class ApiException extends RuntimeException {

	private final ErrorCode code;

	public ApiException(ErrorCode code, String detail) {
		super(detail);
		this.code = code;
	}

	public ErrorCode code() {
		return this.code;
	}

}
