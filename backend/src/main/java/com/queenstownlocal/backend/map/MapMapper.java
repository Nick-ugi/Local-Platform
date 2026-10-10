package com.queenstownlocal.backend.map;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface MapMapper {

	/**
	 * Finds the public places inside the box, oldest first, at most {@code limit} of them. An empty
	 * {@code categories} means every category.
	 */
	List<PlaceMarker> findPlaceMarkers(@Param("west") double west, @Param("south") double south,
			@Param("east") double east, @Param("north") double north, @Param("categories") List<String> categories,
			@Param("limit") int limit);

}
