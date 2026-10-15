package com.queenstownlocal.backend.sitemap;

import java.time.OffsetDateTime;
import java.util.List;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface SitemapMapper {

	/** Every public place. */
	List<SitemapEntry> findPlaces();

	/** The events the list shows at {@code now}. */
	List<SitemapEntry> findEvents(@Param("now") OffsetDateTime now);

	/** The notices the list shows at {@code now}. */
	List<SitemapEntry> findNotices(@Param("now") OffsetDateTime now);

}
