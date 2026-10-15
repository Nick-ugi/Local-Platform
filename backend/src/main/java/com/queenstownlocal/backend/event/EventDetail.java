package com.queenstownlocal.backend.event;

import java.time.Instant;

/**
 * Event detail response. The fields are the detail fields of Event in docs/06-api-specification.md.
 * {@code ended} is true once the event is over; its page stays, saying so.
 */
public record EventDetail(String slug, String title, Instant startsAt, Instant endsAt, String venueName,
		String imageUrl, double latitude, double longitude, String description, String address, String source,
		String sourceUrl, Instant updatedAt, boolean ended) {
}
