package com.queenstownlocal.backend.admin;

import java.util.List;

import com.queenstownlocal.backend.common.error.ApiException;

/** Reading the parameters of the admin lists (docs/06-api-specification.md, section 9). */
final class AdminQuery {

	static final List<String> STATUSES = List.of("public", "private");

	private static final int MAX_QUERY_LENGTH = 100;

	private AdminQuery() {
	}

	/** An ILIKE pattern for the name or title, with the wildcards of the text escaped, or null for none. */
	static String pattern(String q) {
		String text = q == null ? "" : q.strip();
		if (text.length() > MAX_QUERY_LENGTH) {
			throw ApiException.invalid("q", "must be " + MAX_QUERY_LENGTH + " characters or fewer");
		}
		if (text.isEmpty()) {
			return null;
		}
		return "%" + text.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_") + "%";
	}

	/** A code from a list, or null when the parameter is absent. */
	static String code(String field, String value, List<String> codes) {
		if (value == null || value.isEmpty()) {
			return null;
		}
		if (!codes.contains(value)) {
			throw ApiException.invalid(field, "has an unknown value");
		}
		return value;
	}

}
