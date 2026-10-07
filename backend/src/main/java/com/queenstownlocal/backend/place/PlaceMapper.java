package com.queenstownlocal.backend.place;

import java.util.Optional;

import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface PlaceMapper {

	/** Finds a place by slug. Private places are treated as absent. */
	Optional<PlaceDetail> findPublicBySlug(String slug);

}
