package com.queenstownlocal.backend.me;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import com.queenstownlocal.backend.place.PlaceSummary;

@Mapper
public interface FavoriteMapper {

	/** The id of a public place, or nothing for one that is missing or private. */
	Optional<Long> findPublicPlaceId(String slug);

	/** Saves the place. Saving it again keeps the first time it was saved. */
	void insert(@Param("userId") long userId, @Param("placeId") long placeId,
			@Param("createdAt") OffsetDateTime createdAt);

	void delete(@Param("userId") long userId, @Param("slug") String slug);

	/** The saved public places, most recently saved first, without distances. */
	List<PlaceSummary> findPlaces(long userId);

}
