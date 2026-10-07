package com.queenstownlocal.backend.place;

import org.springframework.stereotype.Service;

import com.queenstownlocal.backend.common.error.ApiException;
import com.queenstownlocal.backend.common.error.ErrorCode;

@Service
public class PlaceService {

	private final PlaceMapper placeMapper;

	public PlaceService(PlaceMapper placeMapper) {
		this.placeMapper = placeMapper;
	}

	public PlaceDetail getPublicPlace(String slug) {
		return this.placeMapper.findPublicBySlug(slug)
			.orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "Place not found."));
	}

}
