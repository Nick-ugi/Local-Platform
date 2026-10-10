package com.queenstownlocal.backend.common.error;

/** One entry of {@code errors} in an error response: the request field and what is wrong with it. */
public record FieldMessage(String field, String message) {
}
