package com.queenstownlocal.backend.notice;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface NoticeMapper {

	/** Finds a public notice by slug, ended or not. {@code now} decides {@code ended}. */
	Optional<NoticeDetail> findPublicBySlug(@Param("slug") String slug, @Param("now") OffsetDateTime now);

	/**
	 * Finds one page of the notices that have not ended at {@code now}, latest start first. A null
	 * {@code type} means every type.
	 */
	List<NoticeSummary> findListed(@Param("now") OffsetDateTime now, @Param("type") String type,
			@Param("limit") int limit, @Param("offset") long offset);

	/** Counts the notices {@link #findListed} pages through. */
	long countListed(@Param("now") OffsetDateTime now, @Param("type") String type);

}
