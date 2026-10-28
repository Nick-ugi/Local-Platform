package com.queenstownlocal.backend.map;

/** A place on the map. The fields are those of a {@code place} marker in docs/06-api-specification.md. */
public record PlaceMarker(String kind, String slug, double latitude, double longitude, String name, String category,
		String subtype, String openingHours) implements Marker {
}
