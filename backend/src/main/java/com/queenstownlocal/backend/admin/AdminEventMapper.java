package com.queenstownlocal.backend.admin;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface AdminEventMapper {

	List<AdminEvent> find(@Param("pattern") String pattern, @Param("status") String status, @Param("limit") int limit,
			@Param("offset") long offset);

	long count(@Param("pattern") String pattern, @Param("status") String status);

	Optional<AdminEvent> findById(long id);

	List<String> findSlugs(String base);

	long insert(@Param("slug") String slug, @Param("event") AdminEventRequest event, @Param("now") OffsetDateTime now);

	int update(@Param("id") long id, @Param("event") AdminEventRequest event, @Param("now") OffsetDateTime now);

}
