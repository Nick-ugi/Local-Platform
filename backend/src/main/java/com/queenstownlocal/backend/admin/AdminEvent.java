package com.queenstownlocal.backend.admin;

import java.time.Instant;

/** An event as the admin lists and forms see it. Times are UTC. */
public record AdminEvent(long id, String slug, String title, String description, Instant startsAt, Instant endsAt,
		String venueName, String address, double latitude, double longitude, String imageUrl, String source,
		String sourceUrl, String status, Instant createdAt, Instant updatedAt) {
}
