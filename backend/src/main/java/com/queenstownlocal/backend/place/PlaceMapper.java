package com.queenstownlocal.backend.place;

import java.util.List;
import java.util.Optional;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface PlaceMapper {

	/** Finds a place by slug. Private places are treated as absent. */
	Optional<PlaceDetail> findPublicBySlug(String slug);

	/**
	 * Finds one page of the public places, nearest to the reference point first. A null
	 * {@code category} means every category. Each of {@code patterns} is an ILIKE pattern that the
	 * name, the description or the address has to match. The distance is filled only when
	 * {@code withDistance} is set.
	 */
	List<PlaceSummary> findPublicPlaces(@Param("category") String category, @Param("patterns") List<String> patterns,
			@Param("lat") double lat, @Param("lng") double lng, @Param("withDistance") boolean withDistance,
			@Param("limit") int limit, @Param("offset") long offset);

	/** Counts the places {@link #findPublicPlaces} pages through. */
	long countPublicPlaces(@Param("category") String category, @Param("patterns") List<String> patterns);

}
