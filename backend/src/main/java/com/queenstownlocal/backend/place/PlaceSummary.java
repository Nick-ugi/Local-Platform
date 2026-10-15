package com.queenstownlocal.backend.place;

/**
 * A place in a list. The fields are the list fields of Place in docs/06-api-specification.md.
 * {@code distanceM} is in whole metres and null when the request named no position.
 */
public record PlaceSummary(String slug, String name, String category, String subtype, String address,
		String imageUrl, double latitude, double longitude, Integer distanceM) {
}
