package com.queenstownlocal.backend.notice;

import java.time.Instant;

/**
 * Notice detail response. The fields are the detail fields of Notice in
 * docs/06-api-specification.md. A notice without a location has null coordinates and
 * {@code locationName}; {@code ended} is true once its end has passed.
 */
public record NoticeDetail(String slug, String title, String type, boolean isOfficial, Instant startsAt,
		Instant endsAt, String summary, String locationName, Double latitude, Double longitude, String sourceOrg,
		String sourceUrl, Instant updatedAt, boolean ended) {
}
