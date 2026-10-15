package com.queenstownlocal.backend.map;

import java.time.Instant;

/** A notice on the map. The fields are those of a {@code notice} marker in docs/06-api-specification.md. */
public record NoticeMarker(String kind, String slug, double latitude, double longitude, String title, String type,
		boolean isOfficial, Instant startsAt, Instant endsAt) implements Marker {
}
