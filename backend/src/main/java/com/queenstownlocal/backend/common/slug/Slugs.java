package com.queenstownlocal.backend.common.slug;

import java.text.Normalizer;
import java.util.Collection;
import java.util.Locale;

/**
 * Slugs from names and titles (docs/05-erd.md, section 6): lower case letters and digits joined by
 * hyphens. "Café Ōtautahi & Co." becomes "cafe-otautahi-co". When the slug is taken, a number is
 * added: "-2", "-3" and so on.
 */
public final class Slugs {

	private Slugs() {
	}

	/**
	 * The slug of a name, at most {@code maxLength} characters and leaving room for a number. A name
	 * with no letters or digits gets {@code fallback}.
	 */
	public static String base(String name, String fallback, int maxLength) {
		String plain = Normalizer.normalize(name == null ? "" : name, Normalizer.Form.NFKD)
			.replaceAll("\\p{M}+", "")
			.toLowerCase(Locale.ROOT)
			.replaceAll("[^a-z0-9]+", "-")
			.replaceAll("^-+|-+$", "");
		// Room for "-" and a number of up to five digits.
		int room = maxLength - 6;
		if (plain.length() > room) {
			plain = plain.substring(0, room).replaceAll("-+$", "");
		}
		return plain.isEmpty() ? fallback : plain;
	}

	/** {@code base}, or the first of "base-2", "base-3", ... that is not among {@code taken}. */
	public static String unique(String base, Collection<String> taken) {
		if (!taken.contains(base)) {
			return base;
		}
		for (int n = 2;; n++) {
			String candidate = base + "-" + n;
			if (!taken.contains(candidate)) {
				return candidate;
			}
		}
	}

}
