package com.queenstownlocal.backend.event;

import java.time.Instant;

/** An event in a list. The fields are the list fields of Event in docs/06-api-specification.md. */
public record EventSummary(String slug, String title, Instant startsAt, Instant endsAt, String venueName,
		String imageUrl, double latitude, double longitude) {
}
