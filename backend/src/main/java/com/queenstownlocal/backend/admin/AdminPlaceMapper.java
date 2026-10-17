package com.queenstownlocal.backend.admin;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface AdminPlaceMapper {

	List<AdminPlace> find(@Param("pattern") String pattern, @Param("status") String status,
			@Param("category") String category, @Param("limit") int limit, @Param("offset") long offset);

	long count(@Param("pattern") String pattern, @Param("status") String status, @Param("category") String category);

	Optional<AdminPlace> findById(long id);

	/** The slugs that are {@code base} or start with "base-". */
	List<String> findSlugs(String base);

	long insert(@Param("slug") String slug, @Param("place") AdminPlaceRequest place, @Param("now") OffsetDateTime now);

	/** Changes every field but the slug. Returns how many rows changed: 0 for an unknown id. */
	int update(@Param("id") long id, @Param("place") AdminPlaceRequest place, @Param("now") OffsetDateTime now);

}
