package com.queenstownlocal.backend.notice;

import java.time.Clock;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;

import org.springframework.stereotype.Service;

import com.queenstownlocal.backend.common.error.ApiException;
import com.queenstownlocal.backend.common.error.ErrorCode;
import com.queenstownlocal.backend.common.page.PageResponse;
import com.queenstownlocal.backend.common.page.Paging;

@Service
public class NoticeService {

	private final NoticeMapper noticeMapper;

	private final Clock clock;

	public NoticeService(NoticeMapper noticeMapper, Clock clock) {
		this.noticeMapper = noticeMapper;
		this.clock = clock;
	}

	public NoticeDetail getPublicNotice(String slug) {
		return this.noticeMapper.findPublicBySlug(slug, now())
			.orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "Notice not found."));
	}

	/**
	 * One page of the notices that have not ended, latest first (NOTICE-01, NOTICE-05). Notices
	 * that start later are already listed: a road closure is worth knowing before it begins.
	 */
	public PageResponse<NoticeSummary> findListedNotices(String type, Integer page, Integer size) {
		if (type != null && !NoticeType.CODES.contains(type)) {
			throw ApiException.invalid("type", "has an unknown value");
		}
		Paging paging = Paging.of(page, size);
		OffsetDateTime now = now();

		long total = this.noticeMapper.countListed(now, type);
		return new PageResponse<>(this.noticeMapper.findListed(now, type, paging.size(), paging.offset()),
				paging.page(), paging.size(), total);
	}

	/** Times go to the database with their offset, so the session's time zone plays no part. */
	private OffsetDateTime now() {
		return this.clock.instant().atOffset(ZoneOffset.UTC);
	}

}
