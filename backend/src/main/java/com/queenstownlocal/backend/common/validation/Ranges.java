package com.queenstownlocal.backend.common.validation;

import com.queenstownlocal.backend.common.error.ApiException;

/** Range checks for request values. A value outside its range is reported by the name of its field. */
public final class Ranges {

	private Ranges() {
	}

	/** Requires {@code -limit <= value <= limit}, which is how latitudes and longitudes are bounded. */
	public static void requireWithin(String field, double value, int limit) {
		// Written so that NaN, which fails every comparison, is rejected as well.
		if (!(value >= -limit && value <= limit)) {
			throw ApiException.invalid(field, "must be between -" + limit + " and " + limit);
		}
	}

}
