package com.queenstownlocal.backend.admin;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface AdminNoticeMapper {

	List<AdminNotice> find(@Param("pattern") String pattern, @Param("status") String status,
			@Param("type") String type, @Param("limit") int limit, @Param("offset") long offset);

	long count(@Param("pattern") String pattern, @Param("status") String status, @Param("type") String type);

	Optional<AdminNotice> findById(long id);

	List<String> findSlugs(String base);

	long insert(@Param("slug") String slug, @Param("notice") AdminNoticeRequest notice,
			@Param("now") OffsetDateTime now);

	int update(@Param("id") long id, @Param("notice") AdminNoticeRequest notice, @Param("now") OffsetDateTime now);

}
