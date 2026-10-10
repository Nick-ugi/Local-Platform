package com.queenstownlocal.backend.common.error;

import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.TypeMismatchException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

/**
 * Turns every error into the Problem Details body of docs/06-api-specification.md. Spring builds
 * the body for its own exceptions; this class adds {@code code} and, for bad input,
 * {@code errors}.
 */
@RestControllerAdvice
public class GlobalExceptionHandler extends ResponseEntityExceptionHandler {

	private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

	private static final String CODE = "code";

	private static final String ERRORS = "errors";

	@ExceptionHandler(ApiException.class)
	ResponseEntity<Object> handleApiException(ApiException ex, WebRequest request) {
		ErrorCode code = ex.code();
		ProblemDetail body = ProblemDetail.forStatusAndDetail(code.status(), ex.getMessage());
		body.setProperty(CODE, code.name());
		if (!ex.errors().isEmpty()) {
			body.setProperty(ERRORS, ex.errors());
		}
		return handleExceptionInternal(ex, body, new HttpHeaders(), code.status(), request);
	}

	@ExceptionHandler(Exception.class)
	ResponseEntity<Object> handleUnexpected(Exception ex, WebRequest request) {
		log.error("Unexpected error", ex);
		ErrorCode code = ErrorCode.INTERNAL_ERROR;
		ProblemDetail body = ProblemDetail.forStatus(code.status());
		return handleExceptionInternal(ex, body, new HttpHeaders(), code.status(), request);
	}

	@Override
	protected ResponseEntity<Object> handleExceptionInternal(Exception ex, Object body, HttpHeaders headers,
			HttpStatusCode statusCode, WebRequest request) {
		ResponseEntity<Object> response = super.handleExceptionInternal(ex, body, headers, statusCode, request);
		if (response != null && response.getBody() instanceof ProblemDetail problem) {
			addCode(problem, ex);
		}
		return response;
	}

	/** Fills in {@code code} for errors that did not come from an {@link ApiException}. */
	private void addCode(ProblemDetail problem, Exception ex) {
		Map<String, Object> properties = problem.getProperties();
		if (properties != null && properties.containsKey(CODE)) {
			return;
		}
		ErrorCode code = codeFor(problem.getStatus());
		problem.setProperty(CODE, code.name());
		// Spring's own wording describes its internals ("No static resource ..."), so replace it.
		switch (code) {
			case VALIDATION_FAILED -> {
				if (problem.getStatus() == ErrorCode.VALIDATION_FAILED.status().value()) {
					problem.setDetail("Validation failed.");
					problem.setProperty(ERRORS, fieldErrors(ex));
				}
			}
			case NOT_FOUND -> problem.setDetail("Not found.");
			case INTERNAL_ERROR -> problem.setDetail("Unexpected error.");
			default -> {
			}
		}
	}

	private ErrorCode codeFor(int status) {
		if (status >= 500) {
			return ErrorCode.INTERNAL_ERROR;
		}
		return switch (status) {
			case 401 -> ErrorCode.UNAUTHORIZED;
			case 403 -> ErrorCode.FORBIDDEN;
			case 404 -> ErrorCode.NOT_FOUND;
			case 405 -> ErrorCode.METHOD_NOT_ALLOWED;
			default -> ErrorCode.VALIDATION_FAILED;
		};
	}

	private List<FieldMessage> fieldErrors(Exception ex) {
		if (ex instanceof MethodArgumentNotValidException invalid) {
			return invalid.getBindingResult()
				.getFieldErrors()
				.stream()
				.map(error -> new FieldMessage(error.getField(), error.getDefaultMessage()))
				.toList();
		}
		if (ex instanceof MissingServletRequestParameterException missing) {
			return List.of(new FieldMessage(missing.getParameterName(), "is required"));
		}
		if (ex instanceof MethodArgumentTypeMismatchException mismatch) {
			return List.of(new FieldMessage(mismatch.getName(), "has an invalid value"));
		}
		if (ex instanceof TypeMismatchException mismatch && mismatch.getPropertyName() != null) {
			return List.of(new FieldMessage(mismatch.getPropertyName(), "has an invalid value"));
		}
		return List.of();
	}

}
