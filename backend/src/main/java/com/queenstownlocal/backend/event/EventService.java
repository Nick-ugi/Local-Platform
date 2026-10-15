package com.queenstownlocal.backend.event;

import java.time.Clock;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;

import org.springframework.stereotype.Service;

import com.queenstownlocal.backend.common.error.ApiException;
import com.queenstownlocal.backend.common.error.ErrorCode;
import com.queenstownlocal.backend.common.page.PageResponse;
import com.queenstownlocal.backend.common.page.Paging;
import com.queenstownlocal.backend.common.time.NzDates;

@Service
public class EventService {

	private final EventMapper eventMapper;

	private final Clock clock;

	public EventService(EventMapper eventMapper, Clock clock) {
		this.eventMapper = eventMapper;
		this.clock = clock;
	}

	public EventDetail getPublicEvent(String slug) {
		return this.eventMapper.findPublicBySlug(slug, utc(this.clock.instant()))
			.orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "Event not found."));
	}

	/**
	 * One page of the events that are on or still to come, earliest first (EVENT-01, EVENT-05).
	 * {@code when} narrows them to the New Zealand day, week or month (EVENT-02); an event that
	 * touches that span on any day is in it.
	 */
	public PageResponse<EventSummary> findListedEvents(String when, Integer page, Integer size) {
		Instant now = this.clock.instant();
		NzDates.Window window = window(when, now);
		Paging paging = Paging.of(page, size);

		OffsetDateTime from = window == null ? null : utc(window.from());
		OffsetDateTime to = window == null ? null : utc(window.to());
		long total = this.eventMapper.countListed(utc(now), from, to);
		return new PageResponse<>(
				this.eventMapper.findListed(utc(now), from, to, paging.size(), paging.offset()), paging.page(),
				paging.size(), total);
	}

	private static NzDates.Window window(String when, Instant now) {
		if (when == null) {
			return null;
		}
		return switch (when) {
			case "today" -> NzDates.today(now);
			case "week" -> NzDates.week(now);
			case "month" -> NzDates.month(now);
			default -> throw ApiException.invalid("when", "must be today, week or month");
		};
	}

	/** Times go to the database with their offset, so the session's time zone plays no part. */
	private static OffsetDateTime utc(Instant instant) {
		return instant.atOffset(ZoneOffset.UTC);
	}

}
