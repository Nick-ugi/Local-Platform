package com.queenstownlocal.backend.map;

import java.util.Arrays;
import java.util.List;
import java.util.Set;

import org.springframework.stereotype.Service;

import com.queenstownlocal.backend.common.error.ApiException;
import com.queenstownlocal.backend.common.validation.Ranges;
import com.queenstownlocal.backend.place.PlaceCategory;

@Service
public class MapService {

	/** The most markers one response carries. */
	static final int MAX_MARKERS = 500;

	/** Filter values for the kinds of marker this endpoint does not return yet. */
	private static final Set<String> KINDS_WITHOUT_MARKERS = Set.of("event", "notice");

	private final MapMapper mapMapper;

	public MapService(MapMapper mapMapper) {
		this.mapMapper = mapMapper;
	}

	public MarkersResponse findMarkers(double west, double south, double east, double north, String filter) {
		Ranges.requireWithin("west", west, 180);
		Ranges.requireWithin("east", east, 180);
		Ranges.requireWithin("south", south, 90);
		Ranges.requireWithin("north", north, 90);
		if (west >= east) {
			throw ApiException.invalid("west", "must be less than east");
		}
		if (south >= north) {
			throw ApiException.invalid("south", "must be less than north");
		}

		List<String> chosen = filterValues(filter);
		List<String> categories = chosen.stream().filter(PlaceCategory.CODES::contains).toList();
		if (!chosen.isEmpty() && categories.isEmpty()) {
			return new MarkersResponse(List.of(), false);
		}

		// One more than the limit tells whether the area holds more than is sent.
		List<PlaceMarker> found = this.mapMapper.findPlaceMarkers(west, south, east, north, categories,
				MAX_MARKERS + 1);
		boolean truncated = found.size() > MAX_MARKERS;
		return new MarkersResponse(truncated ? found.subList(0, MAX_MARKERS) : found, truncated);
	}

	/** Splits the comma-separated filter. Empty entries are skipped and an unknown value is rejected. */
	private static List<String> filterValues(String filter) {
		if (filter == null) {
			return List.of();
		}
		List<String> values = Arrays.stream(filter.split(",")).map(String::strip).filter(v -> !v.isEmpty()).toList();
		for (String value : values) {
			if (!PlaceCategory.CODES.contains(value) && !KINDS_WITHOUT_MARKERS.contains(value)) {
				throw ApiException.invalid("filter", "has an unknown value");
			}
		}
		return values;
	}

}
