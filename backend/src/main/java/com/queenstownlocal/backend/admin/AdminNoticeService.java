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
import com.queenstownlocal.backend.notice.NoticeType;

/** Notices for the admin (ADMIN-04). The same rules as AdminPlaceService. */
@Service
public class AdminNoticeService {

	/** notice.slug is varchar(160). */
	private static final int SLUG_LENGTH = 160;

	private final AdminNoticeMapper notices;

	private final Clock clock;

	public AdminNoticeService(AdminNoticeMapper notices, Clock clock) {
		this.notices = notices;
		this.clock = clock;
	}

	public PageResponse<AdminNotice> list(String q, String status, String type, Integer page, Integer size) {
		String pattern = AdminQuery.pattern(q);
		String statusCode = AdminQuery.code("status", status, AdminQuery.STATUSES);
		String typeCode = AdminQuery.code("type", type, NoticeType.CODES);
		Paging paging = Paging.of(page, size);
		long total = this.notices.count(pattern, statusCode, typeCode);
		return new PageResponse<>(this.notices.find(pattern, statusCode, typeCode, paging.size(), paging.offset()),
				paging.page(), paging.size(), total);
	}

	public AdminNotice get(long id) {
		return this.notices.findById(id)
			.orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "Notice not found."));
	}

	@Transactional
	public AdminNotice create(AdminNoticeRequest request) {
		AdminNoticeRequest notice = clean(request);
		String base = Slugs.base(notice.title(), "notice", SLUG_LENGTH);
		for (int attempt = 1;; attempt++) {
			String slug = Slugs.unique(base, this.notices.findSlugs(base));
			try {
				return get(this.notices.insert(slug, notice, now()));
			}
			catch (DuplicateKeyException ex) {
				if (attempt == 3) {
					throw ex;
				}
			}
		}
	}

	@Transactional
	public AdminNotice update(long id, AdminNoticeRequest request) {
		if (this.notices.update(id, clean(request), now()) == 0) {
			throw new ApiException(ErrorCode.NOT_FOUND, "Notice not found.");
		}
		return get(id);
	}

	private static AdminNoticeRequest clean(AdminNoticeRequest r) {
		return new AdminNoticeRequest(Text.clean(r.title()), r.type(), Text.clean(r.summary()), r.startsAt(),
				r.endsAt(), Text.clean(r.locationName()), r.latitude(), r.longitude(), Text.clean(r.sourceOrg()),
				Text.clean(r.sourceUrl()), r.isOfficial(), r.status());
	}

	private OffsetDateTime now() {
		return this.clock.instant().atOffset(ZoneOffset.UTC);
	}

}
