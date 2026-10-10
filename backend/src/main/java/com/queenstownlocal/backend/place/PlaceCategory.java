package com.queenstownlocal.backend.place;

import java.util.List;

/**
 * Category codes of a place (docs/05-erd.md, section 4). The constraint ck_place_category and
 * CATEGORIES in the shared package hold the same list; shared/src/codes.test.ts compares them.
 */
public final class PlaceCategory {

	public static final List<String> CODES = List.of("food", "cafe", "bar", "activity", "shopping", "facility");

	private PlaceCategory() {
	}

}
