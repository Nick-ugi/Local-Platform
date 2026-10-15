package com.queenstownlocal.backend.map;

import java.time.Instant;

/** An event on the map. The fields are those of an {@code event} marker in docs/06-api-specification.md. */
public record EventMarker(String kind, String slug, double latitude, double longitude, String title,
		Instant startsAt, Instant endsAt, String venueName) implements Marker {
}
