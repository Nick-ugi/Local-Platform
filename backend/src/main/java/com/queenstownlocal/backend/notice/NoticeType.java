package com.queenstownlocal.backend.notice;

import java.util.List;

/**
 * Notice type codes (docs/05-erd.md, section 4). The constraint ck_notice_type and NOTICE_TYPES in
 * the shared package hold the same list; shared/src/codes.test.ts compares them.
 */
public final class NoticeType {

	public static final List<String> CODES = List.of("road-work", "road-closure", "public-notice", "emergency");

	private NoticeType() {
	}

}
