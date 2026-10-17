package com.queenstownlocal.backend.admin;

import java.time.Instant;

/** A notice as the admin lists and forms see it. Without a location, latitude and longitude are null. */
public record AdminNotice(long id, String slug, String title, String type, String summary, Instant startsAt,
		Instant endsAt, String locationName, Double latitude, Double longitude, String sourceOrg, String sourceUrl,
		boolean isOfficial, String status, Instant createdAt, Instant updatedAt) {
}
