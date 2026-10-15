package com.queenstownlocal.backend.notice;

import java.time.Instant;

/** A notice in a list. The fields are the list fields of Notice in docs/06-api-specification.md. */
public record NoticeSummary(String slug, String title, String type, boolean isOfficial, Instant startsAt,
		Instant endsAt) {
}
