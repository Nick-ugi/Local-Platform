package com.queenstownlocal.backend.place;

import java.util.List;

/**
 * Subtype codes of a facility (docs/05-erd.md, section 4). The constraint ck_place_subtype and
 * FACILITY_SUBTYPES in the shared package hold the same list; shared/src/codes.test.ts compares them.
 */
public final class FacilitySubtype {

	public static final List<String> CODES = List.of("toilet", "parking", "information", "library", "medical",
			"other");

	private FacilitySubtype() {
	}

}
