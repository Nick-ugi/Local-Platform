package com.queenstownlocal.backend.admin;

import java.time.Clock;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;

import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.queenstownlocal.backend.common.error.ApiException;
import com.queenstownlocal.backend.common.error.ErrorCode;
import com.queenstownlocal.backend.common.page.PageResponse;
import com.queenstownlocal.backend.common.page.Paging;
import com.queenstownlocal.backend.common.slug.Slugs;

/** Events for the admin (ADMIN-03). The same rules as AdminPlaceService. */
@Service
public class AdminEventService {

	/** event.slug is varchar(160). */
	private static final int SLUG_LENGTH = 160;

	private final AdminEventMapper events;

	private final Clock clock;

	public AdminEventService(AdminEventMapper events, Clock clock) {
		this.events = events;
		this.clock = clock;
	}

	public PageResponse<AdminEvent> list(String q, String status, Integer page, Integer size) {
		String pattern = AdminQuery.pattern(q);
		String statusCode = AdminQuery.code("status", status, AdminQuery.STATUSES);
		Paging paging = Paging.of(page, size);
		long total = this.events.count(pattern, statusCode);
		return new PageResponse<>(this.events.find(pattern, statusCode, paging.size(), paging.offset()),
				paging.page(), paging.size(), total);
	}

	public AdminEvent get(long id) {
		return this.events.findById(id).orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "Event not found."));
	}

	@Transactional
	public AdminEvent create(AdminEventRequest request) {
		AdminEventRequest event = clean(request);
		String base = Slugs.base(event.title(), "event", SLUG_LENGTH);
		for (int attempt = 1;; attempt++) {
			String slug = Slugs.unique(base, this.events.findSlugs(base));
			try {
				return get(this.events.insert(slug, event, now()));
			}
			catch (DuplicateKeyException ex) {
				if (attempt == 3) {
					throw ex;
				}
			}
		}
	}

	@Transactional
	public AdminEvent update(long id, AdminEventRequest request) {
		if (this.events.update(id, clean(request), now()) == 0) {
			throw new ApiException(ErrorCode.NOT_FOUND, "Event not found.");
		}
		return get(id);
	}

	private static AdminEventRequest clean(AdminEventRequest r) {
		return new AdminEventRequest(Text.clean(r.title()), Text.clean(r.description()), r.startsAt(), r.endsAt(),
				Text.clean(r.venueName()), Text.clean(r.address()), r.latitude(), r.longitude(),
				Text.clean(r.imageUrl()), Text.clean(r.source()), Text.clean(r.sourceUrl()), r.status());
	}

	private OffsetDateTime now() {
		return this.clock.instant().atOffset(ZoneOffset.UTC);
	}

}
