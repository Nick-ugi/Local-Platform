package com.queenstownlocal.backend.admin;

/** Tidying text from the admin forms. */
final class Text {

	private Text() {
	}

	/** The value without surrounding spaces, and null for one that is empty or only spaces. */
	static String clean(String value) {
		if (value == null) {
			return null;
		}
		String stripped = value.strip();
		return stripped.isEmpty() ? null : stripped;
	}

}
