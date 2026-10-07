package com.queenstownlocal.backend.place;

import java.time.Instant;

/** Place detail response. The fields are the detail fields of Place in docs/06-api-specification.md. */
public record PlaceDetail(String slug, String name, String category, String subtype, String address, String imageUrl,
		double latitude, double longitude, String description, String openingHours, String phone, String website,
		String source, String sourceUrl, Instant updatedAt) {
}
