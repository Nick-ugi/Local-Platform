package com.queenstownlocal.backend.place;

import java.util.Arrays;
import java.util.List;

import org.springframework.stereotype.Service;

import com.queenstownlocal.backend.common.error.ApiException;
import com.queenstownlocal.backend.common.error.ErrorCode;
import com.queenstownlocal.backend.common.page.PageResponse;
import com.queenstownlocal.backend.common.page.Paging;
import com.queenstownlocal.backend.common.validation.Ranges;

@Service
public class PlaceService {

	/**
	 * Queenstown centre: the reference point of a list when the request names no position
	 * (docs/06-api-specification.md, section 1). SERVICE_CENTER in the shared package is the same point.
	 */
	static final double CENTER_LATITUDE = -45.0312;

	static final double CENTER_LONGITUDE = 168.6626;

	/** The longest search text a request may carry. */
	static final int MAX_QUERY_LENGTH = 100;

	private final PlaceMapper placeMapper;

	public PlaceService(PlaceMapper placeMapper) {
		this.placeMapper = placeMapper;
	}

	public PlaceDetail getPublicPlace(String slug) {
		return this.placeMapper.findPublicBySlug(slug)
			.orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "Place not found."));
	}

	/**
	 * One page of the public places, nearest first: nearest to the given position, or to the centre
	 * of Queenstown when the request has none. Only a request with a position gets distances.
	 */
	public PageResponse<PlaceSummary> findPublicPlaces(String category, String q, Double lat, Double lng,
			Integer page, Integer size) {
		if (category != null && !PlaceCategory.CODES.contains(category)) {
			throw ApiException.invalid("category", "has an unknown value");
		}
		if (lat != null && lng == null) {
			throw ApiException.invalid("lng", "is required with lat");
		}
		if (lng != null && lat == null) {
			throw ApiException.invalid("lat", "is required with lng");
		}
		boolean hasPosition = lat != null;
		if (hasPosition) {
			Ranges.requireWithin("lat", lat, 90);
			Ranges.requireWithin("lng", lng, 180);
		}
		List<String> patterns = searchPatterns(q);
		Paging paging = Paging.of(page, size);

		long total = this.placeMapper.countPublicPlaces(category, patterns);
		List<PlaceSummary> items = this.placeMapper.findPublicPlaces(category, patterns,
				hasPosition ? lat : CENTER_LATITUDE, hasPosition ? lng : CENTER_LONGITUDE, hasPosition, paging.size(),
				paging.offset());
		return new PageResponse<>(items, paging.page(), paging.size(), total);
	}

	/**
	 * Turns the search text into one ILIKE pattern per word. The characters ILIKE reads as
	 * wildcards are escaped, so they are searched for as text. No words means no search.
	 */
	private static List<String> searchPatterns(String q) {
		String text = q == null ? "" : q.strip();
		if (text.length() > MAX_QUERY_LENGTH) {
			throw ApiException.invalid("q", "must be " + MAX_QUERY_LENGTH + " characters or fewer");
		}
		if (text.isEmpty()) {
			return List.of();
		}
		return Arrays.stream(text.split("\\s+"))
			.map(word -> "%" + word.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_") + "%")
			.toList();
	}

}
