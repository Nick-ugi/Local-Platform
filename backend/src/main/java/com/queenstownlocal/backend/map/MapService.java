package com.queenstownlocal.backend.map;

import java.time.Clock;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.function.IntFunction;

import org.springframework.stereotype.Service;

import com.queenstownlocal.backend.common.error.ApiException;
import com.queenstownlocal.backend.common.validation.Ranges;
import com.queenstownlocal.backend.place.PlaceCategory;

@Service
public class MapService {

	/** The most markers one response carries, of all kinds together. */
	static final int MAX_MARKERS = 500;

	private static final String EVENT = "event";

	private static final String NOTICE = "notice";

	private final MapMapper mapMapper;

	private final Clock clock;

	public MapService(MapMapper mapMapper, Clock clock) {
		this.mapMapper = mapMapper;
		this.clock = clock;
	}

	/**
	 * The markers inside the box. The filter chooses categories of place and the kinds
	 * {@code event} and {@code notice}; without one every kind is shown. Events and notices follow
	 * the listing rules of docs/05-erd.md section 5, and a notice needs a location to be on the map.
	 *
	 * <p>
	 * Notices come first, then events, then places, so the few markers with dates are the last to be
	 * cut when the area holds more than {@link #MAX_MARKERS}.
	 */
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
		boolean everything = chosen.isEmpty();
		List<String> categories = chosen.stream().filter(PlaceCategory.CODES::contains).toList();
		OffsetDateTime now = this.clock.instant().atOffset(ZoneOffset.UTC);

		Collector collector = new Collector();
		if (everything || chosen.contains(NOTICE)) {
			collector.add(limit -> this.mapMapper.findNoticeMarkers(west, south, east, north, now, limit));
		}
		if (everything || chosen.contains(EVENT)) {
			collector.add(limit -> this.mapMapper.findEventMarkers(west, south, east, north, now, limit));
		}
		if (everything || !categories.isEmpty()) {
			collector.add(limit -> this.mapMapper.findPlaceMarkers(west, south, east, north, categories, limit));
		}
		return new MarkersResponse(collector.markers, collector.truncated);
	}

	/** Fills the response kind by kind until it holds {@link #MAX_MARKERS}. */
	private static final class Collector {

		private final List<Marker> markers = new ArrayList<>();

		private boolean truncated;

		void add(IntFunction<List<? extends Marker>> find) {
			int room = MAX_MARKERS - this.markers.size();
			if (this.truncated) {
				return;
			}
			// One more than there is room for tells whether this kind would overflow.
			List<? extends Marker> found = find.apply(room + 1);
			if (found.size() > room) {
				this.markers.addAll(found.subList(0, room));
				this.truncated = true;
			}
			else {
				this.markers.addAll(found);
			}
		}

	}

	/** Splits the comma-separated filter. Empty entries are skipped and an unknown value is rejected. */
	private static List<String> filterValues(String filter) {
		if (filter == null) {
			return List.of();
		}
		List<String> values = Arrays.stream(filter.split(",")).map(String::strip).filter(v -> !v.isEmpty()).toList();
		for (String value : values) {
			if (!PlaceCategory.CODES.contains(value) && !EVENT.equals(value) && !NOTICE.equals(value)) {
				throw ApiException.invalid("filter", "has an unknown value");
			}
		}
		return values;
	}

}
