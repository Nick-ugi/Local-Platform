package com.queenstownlocal.backend.event;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface EventMapper {

	/** Finds a public event by slug, ended or not. {@code now} decides {@code ended}. */
	Optional<EventDetail> findPublicBySlug(@Param("slug") String slug, @Param("now") OffsetDateTime now);

	/**
	 * Finds one page of the events that are not over at {@code now}, earliest start first. With
	 * {@code from} and {@code to}, only events that overlap that span.
	 */
	List<EventSummary> findListed(@Param("now") OffsetDateTime now, @Param("from") OffsetDateTime from,
			@Param("to") OffsetDateTime to, @Param("limit") int limit, @Param("offset") long offset);

	/** Counts the events {@link #findListed} pages through. */
	long countListed(@Param("now") OffsetDateTime now, @Param("from") OffsetDateTime from,
			@Param("to") OffsetDateTime to);

}
