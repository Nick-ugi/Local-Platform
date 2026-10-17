package com.queenstownlocal.backend.admin;

import java.time.Instant;

/** A place as the admin lists and forms see it: the request fields with its id, slug and times. */
public record AdminPlace(long id, String slug, String name, String category, String subtype, String description,
		String address, double latitude, double longitude, String openingHours, String phone, String website,
		String imageUrl, String source, String sourceUrl, String status, Instant createdAt, Instant updatedAt) {
}
