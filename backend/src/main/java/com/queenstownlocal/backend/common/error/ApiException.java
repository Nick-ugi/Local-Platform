package com.queenstownlocal.backend.common.error;

import java.util.List;

/** An error the API reports to the client with a code and a detail message that is safe to show. */
public class ApiException extends RuntimeException {

	private final ErrorCode code;

	private final List<FieldMessage> errors;

	public ApiException(ErrorCode code, String detail) {
		this(code, detail, List.of());
	}

	private ApiException(ErrorCode code, String detail, List<FieldMessage> errors) {
		super(detail);
		this.code = code;
		this.errors = errors;
	}

	/** A request value that breaks a rule. The response names the field in {@code errors}. */
	public static ApiException invalid(String field, String message) {
		return new ApiException(ErrorCode.VALIDATION_FAILED, "Validation failed.",
				List.of(new FieldMessage(field, message)));
	}

	public ErrorCode code() {
		return this.code;
	}

	/** The fields that were wrong. Empty unless the error is about the input. */
	public List<FieldMessage> errors() {
		return this.errors;
	}

}
